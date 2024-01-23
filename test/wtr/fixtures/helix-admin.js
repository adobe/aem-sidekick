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

/* eslint-disable import/no-extraneous-dependencies, max-len */

// @ts-ignore
import fetchMock from 'fetch-mock/esm/client.js';
import { defaultConfigJSONWithPlugins, defaultStatusResponse, defaultDirectoryStatusResponse } from './stubs/helix-admin.js';
import { sharepointDirectoryUrl, sharepointEditorUrl } from '../mocks/browser.js';

export const defaultConfigJSONUrl = 'https://admin.hlx.page/sidekick/adobe/aem-boilerplate/main/config.json';
export const mockFetchConfigJSONSuccess = (overrides = {}) => fetchMock.get(defaultConfigJSONUrl, {
  status: 200,
  body: {
    ...defaultConfigJSONWithPlugins,
    ...overrides,
  },
}, { overwriteRoutes: true });

export const mockFetchConfigJSONNotFound = () => fetchMock.get(defaultConfigJSONUrl, {
  status: 404,
}, { overwriteRoutes: true });

export const defaultLocalConfigJSONUrl = 'http://localhost:3000/tools/sidekick/config.json';
export const mockFetchLocalConfigJSONSuccess = (overrides = {}) => fetchMock.get(defaultLocalConfigJSONUrl, {
  status: 200,
  body: {
    ...defaultConfigJSONWithPlugins,
    ...overrides,
  },
});

export const defaultStatusUrl = 'https://admin.hlx.page/status/adobe/aem-boilerplate/main/?editUrl=auto';
export const mockFetchStatusSuccess = (overrides = {}) => fetchMock.get(defaultStatusUrl, {
  status: 200,
  body: {
    ...defaultStatusResponse,
    ...overrides,
  },
}, { overwriteRoutes: true });

export const editorStatusUrl = `https://admin.hlx.page/status/adobe/aem-boilerplate/main?editUrl=${encodeURIComponent(sharepointEditorUrl)}`;
export const mockEditorFetchStatusSuccess = (overrides = {}) => fetchMock.get(editorStatusUrl, {
  status: 200,
  body: {
    ...defaultStatusResponse,
    ...overrides,
  },
}, { overwriteRoutes: true });

export const directoryStatusUrl = `https://admin.hlx.page/status/adobe/aem-boilerplate/main?editUrl=${encodeURIComponent(sharepointDirectoryUrl)}`;
export const mockDirectoryFetchStatusSuccess = (overrides = {}) => fetchMock.get(directoryStatusUrl, {
  status: 200,
  body: {
    ...defaultDirectoryStatusResponse,
    ...overrides,
  },
}, { overwriteRoutes: true });

export const defaultStatusEditUrl = 'glob:https://admin.hlx.page/status/adobe/aem-boilerplate/main?editUrl=*';
export const mockFetchStatusEditURLSuccess = (overrides = {}) => fetchMock.get(defaultStatusEditUrl, {
  status: 200,
  body: {
    ...defaultStatusResponse,
    ...overrides,
  },
}, { overwriteRoutes: true });

export const mockFetchStatusUnauthorized = () => fetchMock.get(defaultStatusUrl, {
  status: 401,
}, { overwriteRoutes: true });

export const mockFetchStatusNotFound = () => fetchMock.get(defaultStatusUrl, {
  status: 404,
}, { overwriteRoutes: true });

export const mockFetchStatusServerError = () => fetchMock.get(defaultStatusUrl, {
  status: 500,
}, { overwriteRoutes: true });
