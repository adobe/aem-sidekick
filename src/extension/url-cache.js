/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { log } from './log.js';
import { getConfig, setConfig } from './config.js';

/**
 * @type {number} The time to remember matches from discovery in milliseconds
 */
const DISCOVERY_CACHE_TTL = 7200000;

/**
 * Determines if a URL has a Microsoft SharePoint host.
 * @param {string} url The tab URL
 * @param {Object[]} projects The project configurations
 * @returns {boolean} {@code true} if SharePoint host, else {@code false}
 */
export function isSharePointHost(url, projects = []) {
  const { host } = new URL(url);
  return /^[a-z-]+\.sharepoint\.com$/.test(host)
    || !!projects.find((p) => {
      const mp = p.mountpoints && p.mountpoints[0];
      return !host.endsWith('.google.com') && mp && new URL(mp).host === host;
    });
}

/**
 * Determines if a URL has a Google Drive host.
 * @param {string} url The tab URL
 * @returns {boolean} {@code true} if Google Drive host, else {@code false}
 */
export function isGoogleDriveHost(url) {
  const { host } = new URL(url);
  return /^(docs|drive)\.google\.com$/.test(host);
}

/**
 * Encodes the URL to be used in the `/shares/` MSGraph API call
 * @param {string} sharingUrl The sharing URL
 * @returns {string} The encoded sharing URL
 */
function encodeSharingUrl(sharingUrl) {
  const base64 = btoa(sharingUrl)
    .replace(/=/, '')
    .replace(/\//, '_')
    .replace(/\+/, '-');
  return `u!${base64}`;
}

/**
 * Fetches the edit info from Microsoft SharePoint.
 * @todo also use fstab information to figure out the resource path etc.
 * @param {string} url The URL
 * @returns {Promise<Object>} The edit info
 */
async function fetchSharePointEditInfo(url) {
  const spUrl = new URL(url);
  // sometimes sharepoint redirects to an url with a search param `RootFolder` instead of `id`
  // and then the sharelink can't be resolved. so we convert it to `id`
  const rootFolder = spUrl.searchParams.get('RootFolder');
  if (rootFolder) {
    spUrl.searchParams.set('id', rootFolder);
    spUrl.searchParams.delete('RootFolder');
  }
  const shareLink = encodeSharingUrl(spUrl.href);
  spUrl.pathname = `/_api/v2.0/shares/${shareLink}/driveItem`;
  spUrl.search = '';
  let resp = await fetch(spUrl);
  if (!resp.ok) {
    log.debug('unable to resolve edit url ', resp.status, await resp.text());
    return null;
  }
  const data = await resp.json();

  // get root item
  spUrl.pathname = `/_api/v2.0/drives/${data.parentReference.driveId}`;
  resp = await fetch(spUrl);
  if (!resp.ok) {
    log.debug('unable to load root url: ', resp.status, await resp.text());
    return null;
  }
  const rootData = await resp.json();

  const info = {
    status: 200,
    name: data.name,
    sourceLocation: `onedrive:/drives/${data.parentReference.driveId}/items/${data.id}`,
    lastModified: data.lastModifiedDateTime,
  };
  if (data.folder) {
    info.url = data.webUrl;
    info.contentType = 'application/folder';
    info.childCount = data.folder.childCount;
  } else {
    const folder = data.parentReference.path.split(':').pop();
    info.url = `${rootData.webUrl}${folder}/${data.name}`;
    info.contentType = data.file.mimeType;
  }
  return info;
}

/**
 * Fetches the edit info from Google Drive.
 * @todo implement
 * @param {string} url The URL
 * @returns {Promise<Object>} The edit info
 */
async function fetchGoogleDriveEditInfo(url) {
  // todo: implement
  return {
    url,
  };
}

/**
 * @typedef {Object} SidekickConfig
 * @prop {string} [owner] The owner
 * @prop {string} [repo] The repository
 * @description The configuration object
 */

/**
 * The URL cache keeps mappings of URLs to project configurations for the
 * duration of the browser session.
 * Microsoft SharePoint or Google Drive URLs will be looked up in the Franklin Admin Service
 * and expire after 2 hours.
 */
class UrlCache {
  /**
   * Looks up a URL and returns its associated projects, or an empty array.
   * @param {string} url The URL
   * @returns {Promise<Object[]>} The project results from the cached entry
   */
  async get(url) {
    const urlCache = await getConfig('session', 'urlCache') || [];
    const entry = urlCache.find((e) => e.url === url);
    if (entry && (!entry.expiry || entry.expiry > Date.now())) {
      // return results from fresh cache entry
      log.info(`url cache entry found for ${url}`, entry);
      return entry.results;
    }
    return [];
  }

  /**
   * Updates the URL cache for the duration of the browser session.
   * @param {string} url The URL
   * @param {SidekickConfig|SidekickConfig[]} [config] The project config(s)
   * @returns {Promise<void>}
   */
  async set(url, config = {}) {
    // @ts-ignore
    const { owner, repo } = config;
    const createCacheEntry = (cacheUrl, results, expiry = 0) => {
      const entry = { url: cacheUrl, results };
      if (expiry) {
        entry.expiry = expiry;
      }
      return entry;
    };
    const urlCache = await getConfig('session', 'urlCache') || [];
    const urlIndex = urlCache.findIndex((e) => e.url === url);
    if (owner && repo) {
      // static entry
      const entry = createCacheEntry(
        url,
        [{
          owner,
          repo,
          originalRepository: true,
        }],
      );
      if (urlIndex >= 0) {
        // update existing entry
        log.info(`updating static loaded entry for ${url}`, entry);
        urlCache.splice(urlIndex, 1, entry);
      } else {
        // add new entry
        log.info(`adding static entry for ${url}`, entry);
        urlCache.push(entry);
      }
    } else {
      const isSPHost = isSharePointHost(url, Array.isArray(config) ? config : [config]);
      // lookup (for sharepoint and google drive only)
      if (!isSPHost && !isGoogleDriveHost(url)) {
        return;
      }
      if ((await this.get(url)).length === 0) {
        const info = isSPHost
          ? await fetchSharePointEditInfo(url)
          : await fetchGoogleDriveEditInfo(url);
        log.debug('resource edit info', info);

        let results = [];
        // discover project details from edit url
        const discoveryUrl = new URL('https://admin.hlx.page/discover/');
        discoveryUrl.searchParams.append('url', info?.url || url);
        const resp = await fetch(discoveryUrl);
        if (resp.ok) {
          results = await resp.json();
          if (Array.isArray(results) && results.length > 0) {
            // when switching back to a sharepoint tab it can happen that the fetch call to the
            // sharepoint API is no longer authenticated, thus the info returned is null.
            // in this case, we don't want to cache a potentially incomplete discovery response.
            // otherwise cache for 2h.
            const ttl = info ? DISCOVERY_CACHE_TTL : 0;
            const entry = createCacheEntry(url, results, Date.now() + ttl);
            const entryIndex = urlCache.findIndex((e) => e.url === entry.url);
            if (entryIndex >= 0) {
              // update expired cache entry
              log.info('updating discovery cache', entry);
              urlCache.splice(entryIndex, 1, entry);
            } else {
              // add cache entry
              log.info('extending discovery cache', entry);
              urlCache.push(entry);
            }
          }
        }
      } else {
        // existing match in cache
        return;
      }
    }
    await setConfig('session', {
      urlCache,
    });
  }
}

export const urlCache = new UrlCache();
