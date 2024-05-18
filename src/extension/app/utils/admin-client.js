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

import { callAdmin, createAdminUrl } from '../../utils/admin.js';

/**
 * @typedef {import('../store/app.js').AppStore} AppStore
 */

/**
 * @typedef {import('../store/site.js').SiteStore} SiteStore
 */

/**
 * Facilitates calls to the [AEM Admin API]{@link https://www.aem.live/docs/admin.html}
 * and displays localized error messages.
 */
export class AdminClient {
  /**
   * Enumeration of rate limiting sources.
   * @private
   * @type {Object<string, string>}}
   */
  RATE_LIMITER = {
    NONE: '',
    ADMIN: 'AEM',
    ONEDRIVE: 'Microsoft SharePoint',
  };

  /**
   * The app store.
   * @private
   * @type {AppStore}
   */
  appStore;

  /**
   * The site store
   * @private
   * @type {SiteStore}
   */
  siteStore;

  /**
   * Returns an Admin Client.
   * @param {AppStore} appStore The app store
   */
  constructor(appStore) {
    this.appStore = appStore;
    this.siteStore = appStore.siteStore;
  }

  /**
   * Returns the action name based on API and nature of request.
   * @private
   * @param {string} api The API endpoint called
   * @param {boolean} [del] True if the request was destructive
   */
  getAction(api, del) {
    if (api === 'preview' && del) return 'delete';
    if (api === 'live') return del ? 'unpublish' : 'publish';
    return api;
  }

  /**
   * Returns an error message from the server response.
   * @abstract
   * @param {Response} resp The response
   * @returns {string} The error message or an empty string
   */
  getServerError(resp) {
    return resp?.headers?.get('x-error') || '';
  }

  /**
   * Checks if the request has been rate-limited and returns the source.
   * @abstract
   * @param {Response} resp The response
   * @returns {string} The rate limiter (see {@link RATE_LIMITER})
   */
  getRateLimiter(resp) {
    if (resp.status === 429) {
      return this.RATE_LIMITER.ADMIN;
    }
    const error = this.getServerError(resp);
    if (resp.status === 503 && error.includes('(429)') && error.includes('onedrive')) {
      return this.RATE_LIMITER.ONEDRIVE;
    }
    return this.RATE_LIMITER.NONE;
  }

  /**
   * Shows a toast if the server returned an error.
   * @private
   * @param {string} action The action
   * @param {Response} resp The response object
   */
  handleServerError(action, resp) {
    if (resp.ok) {
      return;
    }

    // handle rate limiting
    const limiter = this.getRateLimiter(resp);
    if (limiter) {
      this.appStore.showToast(
        this.appStore.i18n('error_429').replace('$1', limiter),
        'warning',
      );
      return;
    }

    let message = '';
    if (action === 'status' && resp.status === 404) {
      // special handling for status
      message = this.appStore.i18n(this.appStore.isEditor()
        ? 'error_status_404_document'
        : 'error_status_404_content');
    } else {
      // error key fallbacks
      message = this.appStore.i18n(`error_${action}_${resp.status}`)
        || this.appStore.i18n(`error_${action}`)
        || this.appStore.i18n('error_fatal');
    }

    this.appStore.showToast(
      message.replace('$1', this.getServerError(resp)),
      resp.status < 500 ? 'warning' : 'negative',
      () => this.appStore.closeToast(),
    );
  }

  /**
   * Shows a toast if the request failed or did not contain valid JSON.
   * @private
   * @param {string} action The action
   */
  handleFatalError(action) {
    // use standard error key fallbacks
    const msg = this.appStore.i18n(`error_${action}_fatal`)
        || this.appStore.i18n('error_fatal');
    this.appStore.showToast(
      msg.replace('$1', 'https://aemstatus.net/'),
      'negative',
      () => this.appStore.closeToast(),
    );
  }

  /**
   * Creates an Admin API URL for an API and path.
   * @param {string} api The API endpoint to call
   * @param {string} [path] The resource path
   * @param {URLSearchParams} [searchParams] The search parameters
   */
  createUrl(api, path, searchParams) {
    return createAdminUrl(this.siteStore, api, path, searchParams);
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
      resp = await callAdmin(
        this.siteStore,
        'status',
        path,
        {
          searchParams: includeEditUrl
            ? new URLSearchParams(
              [['editUrl', this.appStore.isEditor() ? this.appStore.location.href : 'auto']],
            )
            : undefined,
        },
      );
      if (resp.ok) {
        return resp.json();
      } else if (resp.status === 401) {
        return { status: 401 };
      } else {
        this.handleServerError(this.getAction('status'), resp);
      }
    } catch (e) {
      this.handleFatalError(this.getAction('status'));
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
      const resp = await callAdmin(
        this.siteStore,
        'profile',
      );
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
      const resp = await callAdmin(
        this.siteStore,
        api,
        path,
        { method },
      );
      if (resp.ok) {
        return resp.json();
      } else {
        this.handleServerError(this.getAction(api, del), resp);
      }
    } catch (e) {
      this.handleFatalError(this.getAction(api, del));
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
      const resp = await callAdmin(
        this.siteStore,
        api,
        path,
        { method },
      );
      if (resp.ok) {
        return resp.json();
      } else {
        this.handleServerError(this.getAction(api, del), resp);
      }
    } catch (e) {
      this.handleFatalError(this.getAction(api, del));
    }
    return null;
  }
}
