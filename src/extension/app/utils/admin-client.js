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
import { ERRORS } from '../constants.js';

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
   * @type {RateLimiter}
   */
  #RATE_LIMITER = {
    NONE: '',
    ADMIN: 'AEM',
    ONEDRIVE: 'Microsoft SharePoint',
  };

  /**
   * The app store.
   * @type {AppStore}
   */
  #appStore;

  /**
   * The site store
   * @type {SiteStore}
   */
  #siteStore;

  /**
   * Returns an Admin Client.
   * @param {AppStore} appStore The app store
   */
  constructor(appStore) {
    this.#appStore = appStore;
    this.#siteStore = appStore.siteStore;
  }

  /**
   * Returns the action name based on API and nature of request.
   * @param {string} api The API endpoint called
   * @param {boolean} [del] True if the request was destructive
   */
  #getAction(api, del) {
    if (api === 'preview' && del) return 'delete';
    if (api === 'live') return del ? 'unpublish' : 'publish';
    return api;
  }

  /**
   * Returns an error message from the server response.
   * @param {Response} resp The response
   * @returns {string[]} The error message (or an empty string) and the error code
   */
  #getServerError(resp) {
    return [resp?.headers?.get('x-error') || '', resp?.headers?.get('x-error-code')];
  }

  /**
   * Checks if the request has been rate-limited and returns the source.
   * @param {Response} resp The response
   * @returns {string} The rate limiter (see {@link #RATE_LIMITER})
   */
  #getRateLimiter(resp) {
    if (resp.status === 429) {
      return this.#RATE_LIMITER.ADMIN;
    }
    const [error] = this.#getServerError(resp);
    if (resp.status === 503 && error.includes('(429)') && error.includes('onedrive')) {
      return this.#RATE_LIMITER.ONEDRIVE;
    }
    return this.#RATE_LIMITER.NONE;
  }

  /**
   * Turns an error message template into a regular expression.
   * @param {string} template The template
   * @returns {RegExp} The regular expression
   */
  #createTemplateRegExp(template) {
    const reSource = `[admin] ${template}`
      .replace('$1', '(?<first>.*?)')
      .replace('$2', '(?<second>.*?)')
      .replace('$3', '(?<third>.*?)')
      .replace(/\[/g, '\\[');
    return new RegExp(`^${reSource}$`);
  }

  /**
   * Shows the error toast.
   * @param {string} message The error message
   * @param {string} variant The toast variant (positive, warning, negative)
   */
  #showErrorToast(message, variant) {
    this.#appStore.showToast({
      message,
      variant,
      timeout: 0, // keep open
    });
  }

  /**
   * Returns a localized error message based on action, status code and error message.
   * @param {string} action The action
   * @param {number} status The status code
   * @param {string} [error] The error message
   * @param {string} [errorCode] The error code
   * @returns {string} The localized error message
   */
  getLocalizedError(action, path, status, error, errorCode) {
    let message = '';
    if (status === 401 && path === '/*') {
      // bulk operation of 100+ files requires login
      return this.#appStore.i18n(`bulk_error_${action}_login_required`);
    }
    if (path.startsWith('/.helix/') && error) {
      // special error message for config files
      return this.#appStore.i18n('error_preview_config').replace('$1', error);
    }
    if (error && errorCode) {
      // build error message from template
      const errTemplate = ERRORS.find((e) => e.code === errorCode)?.template;
      if (errTemplate) {
        const errorRegex = this.#createTemplateRegExp(errTemplate);
        const matches = error.match(errorRegex);
        if (matches) {
          const { first, second, third } = matches.groups || {};
          message = this.#appStore.i18n(errorCode)
            .replace('$1', first)
            .replace('$2', second)
            .replace('$3', third);
          return `(${status}) ${message}`;
        }
      }
    }
    // error key fallbacks
    message = this.#appStore.i18n(`error_${action}_${status}`)
      || this.#appStore.i18n(`error_${action}`)
      || (error && this.#appStore.i18n('error_generic').replace('$1', error.replace('[admin] ', '')));
    return `(${status}) ${message}`;
  }

  /**
   * Shows a toast if the server returned an error.
   * @param {string} action The action
   * @param {Response} resp The response object
   */
  #handleServerError(action, path, resp) {
    // handle rate limiting
    const limiter = this.#getRateLimiter(resp);
    if (limiter) {
      this.#showErrorToast(
        `(429) ${this.#appStore.i18n('error_429').replace('$1', limiter)}`,
        'warning',
      );
      return;
    }

    const [error, errorCode] = this.#getServerError(resp);
    const message = this.getLocalizedError(action, path, resp.status, error, errorCode);
    this.#showErrorToast(
      message.replace('$1', error), // in case of generic error
      resp.status < 500 ? 'warning' : 'negative',
    );
  }

  /**
   * Shows a toast if the request failed or did not contain valid JSON.
   * @param {string} action The action
   */
  #handleFatalError(action) {
    // use standard error key fallbacks
    const msg = this.#appStore.i18n(`error_${action}_fatal`)
        || this.#appStore.i18n('error_fatal');
    this.#showErrorToast(
      msg.replace('$1', 'https://status.adobe.com/'),
      'negative',
    );
  }

  /**
   * Creates an Admin API URL for an API and path.
   * @param {string} api The API endpoint to call
   * @param {string} [path] The resource path
   * @param {URLSearchParams} [searchParams] The search parameters
   */
  createUrl(api, path, searchParams) {
    return createAdminUrl(this.#siteStore, api, path, searchParams);
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
        this.#siteStore,
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
          this.#handleServerError(this.#getAction('status'), path, resp);
        }
        return { status: resp.status };
      }
    } catch (e) {
      this.#handleFatalError(this.#getAction('status'));
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
        this.#siteStore,
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
        this.#siteStore,
        api,
        path,
        { method },
      );
      if (resp.ok) {
        return del ? { status: resp.status } : resp.json();
      } else {
        this.#handleServerError(this.#getAction(api, del), path, resp);
      }
    } catch (e) {
      this.#handleFatalError(this.#getAction(api, del));
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
        this.#siteStore,
        api,
        path,
        { method },
      );
      if (resp.ok) {
        return del ? { status: resp.status } : resp.json();
      } else {
        this.#handleServerError(this.#getAction(api, del), path, resp);
      }
    } catch (e) {
      this.#handleFatalError(this.#getAction(api, del));
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
    const path = '/*';
    try {
      const resp = await callAdmin(
        this.#siteStore,
        api,
        path,
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
        this.#handleServerError(this.#getAction(api, del), path, resp);
      }
    } catch (e) {
      this.#handleFatalError(this.#getAction(api, del));
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
        this.#siteStore,
        api,
        path,
      );
      if (resp.ok) {
        return resp.json();
      } else {
        this.#handleServerError(this.#getAction(api), path, resp);
      }
    } catch (e) {
      this.#handleFatalError(this.#getAction(api));
    }
    return null;
  }
}
