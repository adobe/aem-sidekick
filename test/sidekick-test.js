/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/* eslint-disable no-unused-expressions */

// @ts-ignore
import fetchMock from 'fetch-mock/esm/client.js';
import { aTimeout, waitUntil } from '@open-wc/testing';
import sinon from 'sinon';
import { AppStore } from '../src/extension/app/store/app.js';
import { AEMSidekick } from '../src/extension/index.js';
import { recursiveQuery } from './test-utils.js';
import {
  EditorMockEnvironments,
  HelixMockContentSources,
  HelixMockContentType,
  HelixMockEnvironments,
  getDefaultEditorEnviromentLocations,
  mockHelixEnvironment,
  mockLocation,
  restoreEnvironment,
  stubEnvironment,
} from './mocks/environment.js';
import {
  defaultConfigJSON,
  defaultConfigJSONWithHost,
  defaultStatusResponse,
  defaultConfigPlugins,
  defaultSharepointStatusResponse,
  defaultSharepointSheetStatusResponse,
  defaultGdriveStatusResponse,
  defaultDirectorySharepointStatusResponse,
  defaultSharepointProfileResponse,
  defaultGdriveProfileResponse,
  defaultStatusLoggedInNotAuthorizedResponse,
} from './fixtures/helix-admin.js';
import enMessages from '../src/extension/_locales/en/messages.json' with { type: 'json' };

/**
 * Status API
 */
export const defaultStatusUrl = 'https://admin.hlx.page/status/adobe/aem-boilerplate/main/';

/**
 * Status editUrl API
 */
export const defaultStatusEditUrl = 'glob:https://admin.hlx.page/status/adobe/aem-boilerplate/main?editUrl=*';

/**
 * Profile API
 */
export const defaultProfileUrl = 'https://admin.hlx.page/profile/adobe/aem-boilerplate/main';

/**
 * Sidekick Config API
 */
export const defaultConfigJSONUrl = 'https://admin.hlx.page/sidekick/adobe/aem-boilerplate/main/config.json';

export const defaultLocalConfigJSONUrl = 'http://localhost:3000/tools/sidekick/config.json';

/**
 * i18n path
 */
export const englishMessagesUrl = '/test/fixtures/_locales/en/messages.json';

export class SidekickTest {
  /**
   * @type {AppStore}
   */
  appStore;

  /**
   * @type {AEMSidekick}
   */
  sidekick;

  /**
   * @type {sinon.SinonSandbox}
   */
  sandbox;

  config;

  /**
   * Constructor
   * @param {Object} [config] The sidekick configuration
   * @param {AppStore} [appStore] The app store
   */
  constructor(config, appStore = new AppStore()) {
    // Default to english messages
    this.mockFetchEnglishMessagesSuccess();

    this.appStore = appStore;
    this.config = config;
    this.sandbox = sinon.createSandbox();
  }

  /**
   * Create the AEM Sidekick and append it to the document body
   * @param {Object} [config] The sidekick configuration
   * @param {AppStore} [appStore] The app store
   * @returns {AEMSidekick}
   */
  createSidekick(config, appStore) {
    this.sidekick = new AEMSidekick(config || this.config, appStore || this.appStore);
    document.body.appendChild(this.sidekick);

    return this.sidekick;
  }

  /**
   * Destroy the sidekick test instance
   */
  destroy() {
    const { body } = document;
    body.querySelectorAll('aem-sidekick').forEach((sidekick) => sidekick.replaceWith(''));
    this.sidekick = null;
    restoreEnvironment(document);
    this.sandbox.restore();
    fetchMock.reset();
  }

  /**
   * Await the sidekick actionbar to be rendered
   */
  async awaitActionBar() {
    await waitUntil(() => recursiveQuery(this.sidekick, 'action-bar'));
  }

  /**
   * Await the envSwitcher to be rendered
   */
  async awaitEnvSwitcher() {
    await waitUntil(() => recursiveQuery(this.sidekick, 'env-switcher'));
  }

  /**
   * Await the status to be fetched
   */
  async awaitStatusFetched() {
    const statusFetchedSpy = this.sandbox.spy();
    this.sidekick.addEventListener('statusfetched', statusFetchedSpy);
    await waitUntil(() => statusFetchedSpy.calledOnce, 'Status not fetched', { timeout: 2000 });
  }

  /**
   * Await the status to be fetched
   */
  async awaitLoggedOut() {
    const logoutSpy = this.sandbox.spy();
    this.sidekick.addEventListener('loggedout', logoutSpy);
    await waitUntil(() => logoutSpy.calledOnce, 'Logout not compelte', { timeout: 2000 });
  }

  /**
   * Await a toast to appear
   */
  async awaitToast() {
    await waitUntil(() => recursiveQuery(this.sidekick, '.toast-container .message') !== null);
    await aTimeout(500);
  }

  /**
   * Click the close button on the toast
   * @param {string} variant The toast variant type
   * @returns {Promise<void>}
   */
  async clickToastClose(variant = 'positive') {
    await this.awaitToast();
    await waitUntil(() => recursiveQuery(this.sidekick, `action-bar.${variant}`) !== null);
    const closeButton = recursiveQuery(this.sidekick, 'sp-action-button.close');
    closeButton.click();
  }

  /**
   * Click the action button on the toast
   * @param {string} variant The toast variant type
   * @returns {Promise<void>}
   */
  async clickToastAction(variant = 'positive') {
    await this.awaitToast();
    await waitUntil(() => recursiveQuery(this.sidekick, `action-bar.${variant}`) !== null);
    const closeButton = recursiveQuery(this.sidekick, 'sp-action-button.action');
    closeButton.click();
  }

  /**
   * Language Mocks
   */

  /**
   * Mocks fetch of the i18n messages
   * @returns {SidekickTest}
   */
  mockFetchEnglishMessagesSuccess() {
    fetchMock.get(englishMessagesUrl, {
      status: 200,
      body: enMessages,
    }, { overwriteRoutes: true });

    return this;
  }

  /**
   * Environment Status Mocks
   */

  /**
   * Mocks a helix environment
   * @param {HelixMockEnvironments} environment The helix environment
   * @param {HelixMockContentType} contentType The active content type for the environment
   * @param {string} [location] Location override (Optional)
   * @param {string} [sld] Second level domain override (Optional) (Default: hlx)
   * @returns {SidekickTest}
   */
  mockHelixEnvironment(
    environment = HelixMockEnvironments.PREVIEW,
    contentType = HelixMockContentType.DOC,
    location = undefined,
    sld = 'hlx',
  ) {
    mockHelixEnvironment(this.appStore, environment, contentType, location, sld);
    return this;
  }

  /**
   * Mocks an editor/admin environment
   * @param {EditorMockEnvironments} [environment] The editor/admin environment (Default: editor)
   * @param {HelixMockContentType} [contentType] The document type (Default: doc)
   * @param {HelixMockContentSources} [contentSource] The content source (Default: sharepoint)
   * @param {string} [location] Location override (Optional)
   * @returns {SidekickTest}
   */
  mockEditorAdminEnvironment(
    environment = EditorMockEnvironments.EDITOR,
    contentType = HelixMockContentType.DOC,
    contentSource = HelixMockContentSources.SHAREPOINT,
    location = undefined) {
    if (!environment) {
      throw new Error('environment is required');
    }

    // Given the environment, mock the appropriate methods in appStore
    stubEnvironment(environment, this.appStore);

    // Mock the browsers location
    this.mockLocation(location ?? getDefaultEditorEnviromentLocations(contentSource, contentType));

    return this;
  }

  /**
   * Mocks the browsers location
   * @param {string} location The location to mock
   * @returns {SidekickTest}
   */
  mockLocation(location) {
    // Mock the browsers location
    mockLocation(document, location);

    return this;
  }

  /**
   * Fetch Status Mocks
   */

  /**
   * Mocks fetch of the status endpoint
   * @param {boolean} withProfile Whether to include a profile in the response
   * @param {Object} overrides Additional overrides for the status response
   * @param {HelixMockContentSources} contentSource The content source
   * @param {string} statusUrl The status URL
   * @returns {SidekickTest}
   */
  mockFetchStatusSuccess(
    withProfile = false,
    overrides = {},
    contentSource = HelixMockContentSources.SHAREPOINT,
    statusUrl = defaultStatusUrl,
  ) {
    const body = defaultStatusResponse(
      contentSource, withProfile, overrides, new URL(statusUrl).searchParams.get('editUrl'),
    );
    fetchMock.get(statusUrl, {
      status: 200,
      body,
    }, { overwriteRoutes: true });

    return this;
  }

  /**
   * Mocks a 401 response from the status endpoint
   * @param {string} statusUrl The status URL
   * @returns {SidekickTest}
   */
  mockFetchStatusUnauthorized(statusUrl = defaultStatusUrl) {
    fetchMock.get(statusUrl, {
      status: 401,
    }, { overwriteRoutes: true });
    return this;
  }

  /**
   * Mocks a 404 response from the status endpoint
   * @param {string} statusUrl The status URL
   * @returns {SidekickTest}
   */
  mockFetchStatusForbiddenWithProfile(statusUrl = defaultStatusUrl) {
    fetchMock.get(statusUrl, {
      status: 200,
      body: defaultStatusLoggedInNotAuthorizedResponse,
    }, { overwriteRoutes: true });
    return this;
  }

  /**
   * Mocks a 404 response from the status endpoint
   * @param {string} statusUrl The status URL
   * @returns {SidekickTest}
   */
  mockFetchStatusNotFound(statusUrl = defaultStatusUrl) {
    fetchMock.get(statusUrl, {
      status: 404,
    }, { overwriteRoutes: true });
    return this;
  }

  /**
   * Mocks a 500 response from the status endpoint
   * @param {string} statusUrl The status URL
   * @returns {SidekickTest}
   */
  mockFetchStatusError(statusUrl = defaultStatusUrl) {
    fetchMock.get(statusUrl, {
      status: 500,
    }, { overwriteRoutes: true });
    return this;
  }

  /**
   * Mocks a 429 response from the status endpoint
   * @param {string} statusUrl The status URL
   * @returns {SidekickTest}
   */
  mockFetchStatus429(statusUrl = defaultStatusUrl) {
    fetchMock.get(statusUrl, {
      status: 429,
      headers: {
        'x-error': 'Rate limit exceeded',
      },
    }, { overwriteRoutes: true });
    return this;
  }

  /**
   * Sidekick Profile Mocks
   */

  /**
   * Mocks the profile endpoint success
   * @param {HelixMockContentSources} contentSource The content source
   * @param {Object} overrides Additional overrides for the profile response
   * @returns {SidekickTest}
   */
  mockFetchProfileSuccess(contentSource = HelixMockContentSources.SHAREPOINT, overrides = {}) {
    fetchMock.get(defaultProfileUrl, {
      status: 200,
      body: contentSource === HelixMockContentSources.SHAREPOINT
        ? { ...defaultSharepointProfileResponse, ...overrides }
        : { ...defaultGdriveProfileResponse, ...overrides },
    }, { overwriteRoutes: true });

    return this;
  }

  /**
   * Mocks the profile endpoint unauthorized
   * @returns {SidekickTest}
   */
  mockFetchProfileUnauthorized() {
    fetchMock.get(defaultProfileUrl, {
      status: 200,
      body: { status: 401 },
    }, { overwriteRoutes: true });

    return this;
  }

  /**
   * Mocks the profile endpoint error
   * @returns {SidekickTest}
   */
  mockFetchProfileError() {
    fetchMock.get(defaultProfileUrl, {
      status: 500,
    }, { overwriteRoutes: true });

    return this;
  }

  /**
   * Mocks the profile picture fetch
   * @returns {SidekickTest}
   */
  mockFetchProfilePictureSuccess() {
    fetchMock.get('https://admin.hlx.page/profile/adobe/aem-boilerplate/main/user-id/picture', {
      status: 200,
      body: new Blob(),
    }, { overwriteRoutes: true });

    return this;
  }

  /**
   * Sidekick Config Mocks
   */

  /**
   * Mocks fetch of the config endpoint
   * @param {boolean} withHost Whether to include the host in the response
   * @param {boolean} withPlugins Whether to include plugins in the response
   * @param {Object} overrides Additional overrides for the config response
   * @param {boolean} local Whether to use the local config URL
   * @returns {SidekickTest}
   */
  mockFetchSidekickConfigSuccess(
    withHost = true,
    withPlugins = false,
    overrides = {},
    local = false,
  ) {
    let body = withHost ? defaultConfigJSONWithHost : defaultConfigJSON;

    if (withPlugins) {
      body = {
        ...body,
        ...defaultConfigPlugins,
      };
    }

    const configUrl = local ? defaultLocalConfigJSONUrl : defaultConfigJSONUrl;
    fetchMock.get(configUrl, {
      status: 200,
      body: {
        ...body,
        ...overrides,
      },
    }, { overwriteRoutes: true });

    return this;
  }

  /**
   * Mocks a 404 response from the config endpoint
   * @param {string} configUrl The config URL
   * @returns {SidekickTest}
   */
  mockFetchSidekickConfigNotFound(configUrl = defaultConfigJSONUrl) {
    fetchMock.get(configUrl, {
      status: 404,
    }, { overwriteRoutes: true });
    return this;
  }

  /**
   * Mocks a 401 response from the config endpoint
   * @param {string} configUrl The config URL
   * @returns {SidekickTest}
   */
  mockFetchSidekickConfigUnAuthorized(configUrl = defaultConfigJSONUrl) {
    fetchMock.get(configUrl, {
      status: 401,
    }, { overwriteRoutes: true });
    return this;
  }

  /**
   * Mocks a 403 response from the config endpoint
   * @param {string} configUrl The config URL
   * @returns {SidekickTest}
   */
  mockFetchSidekickConfigForbidden(configUrl = defaultConfigJSONUrl) {
    fetchMock.get(configUrl, {
      status: 403,
    }, { overwriteRoutes: true });
    return this;
  }

  /**
   * Mocks the fetch of the sidekick config endpoint
   * @param {HelixMockContentSources} contentSource The content source
   * @param {HelixMockContentType} contentType The content type
   * @param {Object} overrides Additional overrides for the status response
   * @returns {SidekickTest}
   */
  mockFetchEditorStatusSuccess(
    contentSource = HelixMockContentSources.SHAREPOINT,
    contentType = HelixMockContentType.DOC,
    overrides = {},
  ) {
    const url = defaultStatusEditUrl;
    let body = {};
    if (contentSource === HelixMockContentSources.SHAREPOINT) {
      body = contentType === HelixMockContentType.DOC
        ? defaultSharepointStatusResponse
        : defaultSharepointSheetStatusResponse;
    } else if (contentSource === HelixMockContentSources.GDRIVE) {
      body = contentType === HelixMockContentType.DOC
        ? defaultGdriveStatusResponse
        : defaultGdriveStatusResponse;
    }

    fetchMock.get(url, {
      status: 200,
      body: {
        ...body,
        ...overrides,
      },
    }, { overwriteRoutes: true });

    return this;
  }

  /**
   * Mocks the fetch of the sidekick config endpoint
   * @param {HelixMockContentSources} contentSource The content source
   * @param {Object} overrides Additional overrides for the status response
   * @returns {SidekickTest}
   */
  mockFetchDirectoryStatusSuccess(
    contentSource = HelixMockContentSources.SHAREPOINT,
    overrides = {},
  ) {
    const url = defaultStatusEditUrl;
    let body = defaultDirectorySharepointStatusResponse;
    if (contentSource === 'sharepoint') {
      body = defaultDirectorySharepointStatusResponse;
    }

    fetchMock.get(url, {
      status: 200,
      body: {
        ...body,
        ...overrides,
      },
    }, { overwriteRoutes: true });

    return this;
  }
}
