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
 * @typedef {Object} RateLimiter
 * @property {string} NONE - No rate limiter.
 * @property {string} ADMIN - Rate limiter for admin
 * @property {string} ONEDRIVE - Rate limiter for OneDrive
 */

/**
 * Facilitates calls to the [AEM Admin API]{@link https://www.aem.live/docs/admin.html}
 * and displays localized error messages.
 */
export class AdminClient {
  /**
   * Enumeration of rate limiting sources.
   * @private
   * @type {RateLimiter}
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
   * Returns a localized error message based on action, status code and error message.
   * @param {string} action The action
   * @param {number} status The status code
   * @param {string} [error] The error message
   * @returns {string} The localized error message
   */
  getLocalizedError(action, status, error) {
    let message = '';
    if (action === 'status' && status === 404) {
      // special handling for status
      message = this.appStore.i18n(this.appStore.isEditor()
        ? 'error_status_404_document'
        : 'error_status_404_content');
    } else if (status === 400 && (error?.includes('script or event handler')
      || error?.includes('XML'))) {
      // preview: invalid svg
      message = this.appStore.i18n('error_preview_svg_invalid');
    } else if (status === 413) {
      // preview: resource too large
      message = this.appStore.i18n('error_preview_too_large');
    } else if (status === 415) {
      if (error?.includes('docx with google not supported')) {
        // preview: docx in gdrive
        message = this.appStore.i18n('error_preview_no_docx');
      } else if (error?.includes('xlsx with google not supported')) {
        // preview: xlsx in gdrive
        message = this.appStore.i18n('error_preview_no_xlsx');
      } else {
        // preview: unsupported file type
        message = this.appStore.i18n('error_preview_not_supported');
      }
    } else {
      // error key fallbacks
      message = this.appStore.i18n(`error_${action}_${status}`)
        || this.appStore.i18n(`error_${action}`);
    }
    return message;
  }

  /**
   * Shows a toast if the server returned an error.
   * @private
   * @param {string} action The action
   * @param {Response} resp The response object
   */
  handleServerError(action, resp) {
    // handle rate limiting
    const limiter = this.getRateLimiter(resp);
    if (limiter) {
      this.appStore.showToast(
        this.appStore.i18n('error_429').replace('$1', limiter),
        'warning',
      );
      return;
    }

    const message = this.getLocalizedError(action, resp.status, this.getServerError(resp));
    if (message) {
      this.appStore.showToast(
        message.replace('$1', this.getServerError(resp)),
        resp.status < 500 ? 'warning' : 'negative',
        () => this.appStore.closeToast(),
      );
    } else {
      this.handleFatalError(action);
    }
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
   * @param {string} [editUrl] The edit URL to include
   * @returns {Promise<Object>} The JSON response
   */
  async getStatus(path, editUrl) {
    let resp;
    try {
      resp = await callAdmin(
        this.siteStore,
        'status',
        path,
        {
          searchParams: editUrl
            ? new URLSearchParams(
              [['editUrl', editUrl]],
            )
            : undefined,
        },
      );
      if (resp.ok) {
        return resp.json();
      } else {
        if (resp.status !== 401) {
          // special handling for 401
          this.handleServerError(this.getAction('status'), resp);
        }
        return { status: resp.status };
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
   * Updates a preview resource.
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
        return del ? { status: resp.status } : resp.json();
      } else {
        this.handleServerError(this.getAction(api, del), resp);
      }
    } catch (e) {
      this.handleFatalError(this.getAction(api, del));
    }
    return null;
  }

  /**
   * Publishes a resource.
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
        return del ? { status: resp.status } : resp.json();
      } else {
        this.handleServerError(this.getAction(api, del), resp);
      }
    } catch (e) {
      this.handleFatalError(this.getAction(api, del));
    }
    return null;
  }

  /**
   * Starts a bulk job.
   * @see https://www.aem.live/docs/admin.html#tag/preview/operation/bulkPreview
   * @see https://www.aem.live/docs/admin.html#tag/publish/operation/bulkPublish
   * @param {string} api The API endpoint to call
   * @param {string[]} paths The resource paths
   * @param {boolean} [del] True if the resources should be deleted
   * @returns {Promise<Object>} The JSON response
   */
  async startJob(api, paths, del) {
    try {
      const resp = await callAdmin(
        this.siteStore,
        api,
        '/*',
        {
          method: 'post',
          body: {
            paths,
            delete: !!del,
          },
        },
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
   * Returns the job status.
   * @see https://www.aem.live/docs/admin.html#tag/job/operation/getJob
   * @param {string} topic The job topic
   * @param {string} name The job name
   * @param {boolean} [includeDetails] Include job details
   * @returns {Promise<Object>} The JSON response
   */
  async getJob(topic, name, includeDetails) {
    const api = 'job';
    const path = `/${topic}/${name}${includeDetails ? '/details' : ''}`;
    try {
      const resp = await callAdmin(
        this.siteStore,
        api,
        path,
      );
      if (resp.ok) {
        return resp.json();
      } else {
        this.handleServerError(this.getAction(api), resp);
      }
    } catch (e) {
      this.handleFatalError(this.getAction(api));
    }
    return null;
  }
}
