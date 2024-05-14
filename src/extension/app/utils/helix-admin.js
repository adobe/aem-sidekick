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
 * @typedef {import('../store/app.js').AppStore} AppStore
 */

/**
 * @typedef {import('../store/site.js').SiteStore} SiteStore
 */

/**
 * Enumeration of rate limiting sources.
 * @private
 * @type {Object<string, string>}}
 */
const RATE_LIMITER = {
  NONE: '',
  ADMIN: 'AEM',
  ONEDRIVE: 'Microsoft SharePoint',
};

/**
 * Returns an error message from the server response.
 * @param {Response} resp The response
 * @returns {string} The error message or an empty string
 */
export function getServerError(resp) {
  return resp?.headers?.get('x-error') || '';
}

/**
 * Checks if the request has been rate-limited and returns the source.
 * @param {Response} resp The response
 * @returns {string} The rate limiter (see {@link RATE_LIMITER})
 */
function getRateLimiter(resp) {
  if (resp.status === 429) {
    return RATE_LIMITER.ADMIN;
  }
  const error = getServerError(resp);
  if (resp.status === 503 && error.includes('(429)')) {
    if (error.includes('onedrive')) {
      return RATE_LIMITER.ONEDRIVE;
    }
  }
  return RATE_LIMITER.NONE;
}

/**
 * Handle an error from the server.
 * @param {AppStore} appStore The app store
 * @param {string} api The API endpoint called
 * @param {Response} resp The response object
 */
function handleServerError(appStore, api, resp) {
  if (resp.ok) {
    return;
  }

  const limiter = getRateLimiter(resp);
  if (limiter) {
    appStore.showToast(appStore.i18n('error_429').replace('$1', limiter), 'warning');
  }

  let errorKey = '';
  const errorLevel = resp.status < 500 ? 'warning' : 'negative';
  switch (resp.status) {
    case 404:
      if (api === 'status') {
        errorKey = appStore.isEditor()
          ? 'error_status_404_document'
          : 'error_status_404_content';
      } else {
        errorKey = `error_${api}_404`;
      }
      break;
    default:
      errorKey = `error_${api}_${resp.status}`;
  }
  appStore.showToast(appStore.i18n(errorKey), errorLevel);
}

/**
 * Creates an Admin URL for an API and path.
 * @param {SiteStore} siteStore The sidekick config object
 * @param {string} api The API endpoint to call
 * @param {string} path The current path
 * @returns {URL} The admin URL
 */
function getAdminUrl({
  owner, repo, ref, adminVersion,
}, api, path = '', searchParams = new URLSearchParams()) {
  const adminUrl = new URL([
    'https://admin.hlx.page/',
    api,
    `/${owner}`,
    `/${repo}`,
    `/${ref}`,
    path,
  ].join(''));
  if (adminVersion) {
    searchParams.append('hlx-admin-version', adminVersion);
  }
  searchParams.forEach((value, key) => {
    adminUrl.searchParams.append(key, value);
  });
  return adminUrl;
}

/**
 * Calls an Admin URL for an API and path and returns the response.
 * @param {AppStore} appStore The app store
 * @param {Object} opts The options
 * @param {string} [opts.api] The API endpoint to call
 * @param {string} [opts.path] The resource path
 * @param {URLSearchParams} [opts.searchParams] The search parameters
 * @param {string} [opts.method] The method to use
 * @param {Object} [opts.body] The body to send
 * @param {boolean} [opts.omitCredentials] Should we omit the credentials
 * @returns {Promise<Response>} The admin response
 */
async function callAdmin(appStore, {
  api = 'status',
  path = '',
  searchParams = new URLSearchParams(),
  method = 'GET',
  body,
  omitCredentials = false,
}) {
  const url = getAdminUrl(appStore.siteStore, api, path, searchParams);
  const resp = await fetch(url, {
    cache: 'no-store',
    credentials: omitCredentials ? 'omit' : 'include',
    headers: {},
    method,
    body,
  });
  if (!resp.ok) {
    handleServerError(appStore, api, resp);
  }
  return resp;
}

/**
 * Admin API allows interaction with the [AEM Admin API]{@link https://www.aem.live/docs/admin.html}.
 * @param {AppStore} appStore The app store
 * @returns {AdminAPI} The Admin API
 */
export class AdminAPI {
  constructor(appStore) {
    this.appStore = appStore;
    this.siteStore = appStore.siteStore;
  }

  /**
   * Returns the status of a resource.
   * @see https://www.aem.live/docs/admin.html#tag/status/operation/status
   * @param {string} path The resource path
   * @param {boolean} [includeEditUrl] True if the edit URL should be included
   * @returns {Promise<Object>} The JSON response
   */
  async getStatus(path, includeEditUrl = false) {
    const resp = await callAdmin(this.appStore, {
      path,
      searchParams: includeEditUrl
        ? new URLSearchParams(
          [['editUrl', this.appStore.isEditor() ? window.location.href : 'auto']])
        : undefined,
    });
    return resp.ok ? resp.json() : { status: resp.status };
  }

  /**
   * Updates the preview resource.
   * @see https://www.aem.live/docs/admin.html#tag/preview/operation/updatePreview
   * @param {string} path The resource path
   * @returns {Promise<Object>} The JSON response
   */
  async updatePreview(path) {
    const resp = await callAdmin(this.appStore, {
      path,
      api: 'preview',
      method: 'POST',
    });
    return resp.ok ? resp.json() : {};
  }

  /**
   * Publishes a preview resource.
   * @see https://www.aem.live/docs/admin.html#tag/publish/operation/publishResource
   * @param {string} path The resource path
   * @returns {Promise<Object>} The JSON response
   */
  async updateLive(path) {
    const resp = await callAdmin(this.appStore, {
      path,
      api: 'live',
      method: 'POST',
    });
    return resp.ok ? resp.json() : {};
  }
}
