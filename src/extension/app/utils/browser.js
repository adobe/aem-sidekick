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

/**
 * @typedef {import('@Types').ElemConfig} ElemConfig
 */

/**
 * Returns the location of the current document.
 * @param {URL} url The url
 * @private
 * @returns {URL} The location object
 */
export function getResourceURL(url) {
  const { origin, search } = url;
  // check for resource proxy url
  const searchParams = new URLSearchParams(search);
  const resource = searchParams.get('path');
  if (resource) {
    return new URL(resource, origin);
  }
  return url;
}

/**
 * Returns the location of the current document.
 * @private
 * @returns {URL} The location object
 */
export function getLocation() {
  // use window location by default
  let url = new URL(window.location.href);
  // first check if there is a test location
  const $test = document.getElementById('sidekick_test_location');
  if ($test && $test instanceof HTMLInputElement) {
    try {
      url = new URL($test.value);
    } catch (e) {
      return null;
    }
  }

  return getResourceURL(url);
}

/**
 * Retrieves project details from a host name.
 * @private
 * @param {string} host The host name
 * @returns {string[]} The project details
 * @throws {Error} if host is not a project host
 */
export function getProjectDetails(host) {
  const details = host.split('.')[0].split('--');
  if (details.length < 2) {
    throw new Error('not a project host');
  }
  if (details.length === 3) {
    // lose ref
    details.shift();
  }
  return details;
}

/**
 * Checks if a project host name matches another, regardless of ref.
 * @private
 * @param {string} baseHost The base host
 * @param {string} host The host to match against the base host
 * @returns {boolean} <code>true</code> if the hosts match, else <code>false</code>
 */
export function matchProjectHost(baseHost, host) {
  if (!baseHost || !host) {
    return false;
  }
  // direct match
  if (baseHost === host) {
    return true;
  }
  // check for matching domain suffixes
  const previewSuffixes = ['.aem.page', '.hlx.page'];
  const liveSuffixes = ['.aem.live', '.hlx.live'];
  const isPreview = previewSuffixes.some((suffix) => baseHost.endsWith(suffix))
      && previewSuffixes.some((suffix) => host.endsWith(suffix));
  const isLive = liveSuffixes.some((suffix) => baseHost.endsWith(suffix))
      && liveSuffixes.some((suffix) => host.endsWith(suffix));
  if (!isPreview && !isLive) {
    return false;
  }

  // project details
  const [baseHostRepo, baseHostOwner] = getProjectDetails(baseHost);
  const [hostRepo, hostOwner] = getProjectDetails(host);
  return baseHostOwner === hostOwner && baseHostRepo === hostRepo;
}

/**
 * Checks a path against supported file extensions.
 * @private
 * @param {string} path The path to check
 * @returns {boolean} <code>true</code> if file extension supported, else <code>false</code>
 */
export function isSupportedFileExtension(path) {
  const file = path.split('/').pop();
  const extension = file.split('.').pop();
  if (extension === file) {
    return true;
  } else {
    return [
      'json',
      'jpg',
      'jpeg',
      'png',
      'pdf',
      'svg',
    ].includes(extension.toLowerCase());
  }
}

/**
 * Extends a tag.
 * @private
 * @param {HTMLElement} tag The tag to extend
 * @param {ElemConfig}  config The tag configuration object
 * @returns {HTMLElement} The extended tag
 */
function extendTag(tag, config) {
  if (typeof config.attrs === 'object') {
    for (const [key, value] of Object.entries(config.attrs)) {
      tag.setAttribute(key, value);
    }
  }
  if (typeof config.lstnrs === 'object') {
    for (const [name, fn] of Object.entries(config.lstnrs)) {
      if (typeof fn === 'function') {
        tag.addEventListener(name, fn);
      }
    }
  }
  if (typeof config.text === 'string') {
    tag.textContent = config.text;
  }
  return tag;
}

/**
 * Creates a tag.
 * @private
 * @param {ElemConfig} config The tag configuration
 * @returns {HTMLElement} The new tag
 */
export function createTag(config) {
  if (typeof config.tag !== 'string') {
    return null;
  }
  const el = document.createElement(config.tag);
  return extendTag(el, config);
}

/**
 * Determines whether to open a new tab or reuse the existing window.
 * @private
 * @param {KeyboardEvent} evt The event
 * @returns {boolean} true if a new tab should be opened, else false
 */
export function newTab(evt) {
  return evt.metaKey || evt.shiftKey || evt.which === 2;
}

/**
   * Turns a globbing into a regular expression.
   * @private
   * @param {string} glob The globbing
   * @returns The regular expression
   */
export function globToRegExp(glob) {
  if (!glob) {
    glob = '**';
  }
  const reString = glob
    .replace('.', '\\.') // don't match every char, just real dots
    .replace(/\*\*/g, '_')
    .replace(/\*/g, '[0-9a-z-.]*')
    .replace(/_/g, '.*');
  return new RegExp(`^${reString}$`);
}
