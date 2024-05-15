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
 * Returns the action name based on API and nature of request.
 * @param {string} api The API endpoint called
 * @param {boolean} [del] True if the request was destructive
 */
function getAction(api, del) {
  let action = api;
  if (api === 'preview' && del) {
    action = 'delete';
  }
  if (api === 'live') {
    action = del ? 'unpublish' : 'publish';
  }
  return action;
}

/**
 * Shows a toast if the server returned an error.
 * @param {AppStore} appStore The app store
 * @param {string} action The action
 * @param {Response} resp The response object
 */
function handleServerError(appStore, action, resp) {
  if (resp.ok) {
    return;
  }

  const limiter = getRateLimiter(resp);
  if (limiter) {
    appStore.showToast(appStore.i18n('error_429').replace('$1', limiter), 'warning');
  }

  let message = '';
  if (action === 'status' && resp.status === 404) {
    // special handling for status
    message = appStore.i18n(appStore.isEditor()
      ? 'error_status_404_document'
      : 'error_status_404_content');
  } else {
    // error key fallbacks
    message = appStore.i18n(`error_${action}_${resp.status}`)
      || appStore.i18n(`error_${action}`)
      || appStore.i18n('error_fatal');
  }

  appStore.showToast(
    message.replace('$1', getServerError(resp)),
    resp.status < 500 ? 'warning' : 'negative',
    () => appStore.closeToast(),
  );
}

/**
 * Shows a toast if the request failed or did not contain valid JSON.
 * @param {AppStore} appStore The app store
 * @param {string} action The action
 */
function handleFatalError(appStore, action) {
  // use standard error key fallbacks
  const msg = appStore.i18n(`error_${action}_fatal`)
      || appStore.i18n('error_fatal');
  appStore.showToast(
    msg.replace('$1', 'https://aemstatus.net/'),
    'negative',
    () => appStore.closeToast(),
  );
}

/**
 * Creates an Admin URL for an API and path.
 * @param {SiteStore} siteStore The sidekick config object
 * @param {string} api The API endpoint to call
 * @param {string} path The current path
 * @returns {URL} The admin URL
 */
export function getAdminUrl({
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
  method = 'get',
  body,
  omitCredentials = false,
}) {
  const url = getAdminUrl(appStore.siteStore, api, path, searchParams);
  return fetch(url, {
    cache: 'no-store',
    credentials: omitCredentials ? 'omit' : 'include',
    headers: {},
    method,
    body,
  });
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
    let resp;
    try {
      resp = await callAdmin(this.appStore, {
        path,
        searchParams: includeEditUrl ? new URLSearchParams(
          [['editUrl', this.appStore.isEditor() ? this.appStore.location.href : 'auto']],
        ) : undefined,
      });
      if (resp.ok) {
        return resp.json();
      } else if (resp.status === 401) {
        return { status: 401 };
      } else {
        handleServerError(this.appStore, getAction('status'), resp);
      }
    } catch (e) {
      handleFatalError(this.appStore, getAction('status'));
    }
    return null;
  }

  /**
   * Returns the user profile.
   * @see https://www.aem.live/docs/admin.html#tag/profile
   * @returns {Promise<Object>} The JSON response
   */
  async getProfile() {
    try {
      const resp = await callAdmin(this.appStore, {
        api: 'profile',
      });
      if (resp.ok) {
        return resp.json();
      }
    } catch (e) {
      // ignore
    }
    return null;
  }

  /**
   * Updates the preview resource.
   * @see https://www.aem.live/docs/admin.html#tag/preview/operation/updatePreview
   * @param {string} path The resource path
   * @param {boolean} [del] True if the preview should be deleted
   * @returns {Promise<Object>} The JSON response
   */
  async updatePreview(path, del) {
    const api = 'preview';
    const method = del ? 'delete' : 'post';
    try {
      const resp = await callAdmin(this.appStore, {
        path,
        api,
        method,
      });
      if (resp.ok) {
        return resp.json();
      } else {
        handleServerError(this.appStore, getAction(api, del), resp);
      }
    } catch (e) {
      handleFatalError(this.appStore, getAction(api, del));
    }
    return null;
  }

  /**
   * Publishes a preview resource.
   * @see https://www.aem.live/docs/admin.html#tag/publish/operation/publishResource
   * @param {string} path The resource path
   * @param {boolean} [del] True if the preview should be deleted
   * @returns {Promise<Object>} The JSON response
   */
  async updateLive(path, del) {
    const api = 'live';
    const method = del ? 'delete' : 'post';
    try {
      const resp = await callAdmin(this.appStore, {
        path,
        api,
        method,
      });
      if (resp.ok) {
        return resp.json();
      } else {
        handleServerError(this.appStore, getAction(api, del), resp);
      }
    } catch (e) {
      handleFatalError(this.appStore, getAction(api, del));
    }
    return null;
  }
}
