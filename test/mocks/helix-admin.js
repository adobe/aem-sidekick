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
import {
  defaultConfigJSON,
  defaultConfigJSONWithPlugins,
  defaultSharepointStatusResponse,
  defaultGdriveStatusResponse,
  defaultDirectorySharepointStatusResponse,
} from '../fixtures/helix-admin.js';
import {
  getDefaultEditorEnviromentLocations,
} from './environment.js';

export const defaultConfigJSONUrl = 'https://admin.hlx.page/sidekick/adobe/aem-boilerplate/main/config.json';
export const mockFetchConfigWithoutPluginsJSONSuccess = (overrides = {}) => fetchMock.get(defaultConfigJSONUrl, {
  status: 200,
  body: {
    ...defaultConfigJSON,
    ...overrides,
  },
}, { overwriteRoutes: true });

export const mockFetchConfigWithPluginsJSONSuccess = (overrides = {}) => fetchMock.get(defaultConfigJSONUrl, {
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
export const mockFetchStatusSuccess = (overrides = {}, contentSource = 'sharepoint') => fetchMock.get(defaultStatusUrl, {
  status: 200,
  body: contentSource === 'sharepoint' ? { ...defaultSharepointStatusResponse, ...overrides } : { ...defaultGdriveStatusResponse, ...overrides },
}, { overwriteRoutes: true });

export const sharepointEditorDocStatusUrl = `https://admin.hlx.page/status/adobe/aem-boilerplate/main?editUrl=${encodeURIComponent(getDefaultEditorEnviromentLocations('sharepoint', 'doc'))}`;
export const mockSharepointEditorDocFetchStatusSuccess = (overrides = {}) => fetchMock.get(sharepointEditorDocStatusUrl, {
  status: 200,
  body: {
    ...defaultSharepointStatusResponse,
    ...overrides,
  },
}, { overwriteRoutes: true });

export const sharepointEditorSheetStatusUrl = `https://admin.hlx.page/status/adobe/aem-boilerplate/main?editUrl=${encodeURIComponent(getDefaultEditorEnviromentLocations('sharepoint', 'sheet'))}`;
export const mockSharepointEditorSheetFetchStatusSuccess = (overrides = {}) => fetchMock.get(sharepointEditorSheetStatusUrl, {
  status: 200,
  body: {
    ...defaultSharepointStatusResponse,
    ...overrides,
  },
}, { overwriteRoutes: true });

export const gdriveEditorStatusUrl = `https://admin.hlx.page/status/adobe/aem-boilerplate/main?editUrl=${encodeURIComponent(getDefaultEditorEnviromentLocations('gdrive', 'doc'))}`;
export const mockGdriveEditorFetchStatusSuccess = (overrides = {}) => fetchMock.get(gdriveEditorStatusUrl, {
  status: 200,
  body: {
    ...defaultGdriveStatusResponse,
    ...overrides,
  },
}, { overwriteRoutes: true });

export const sharepointDirectoryStatusUrl = `https://admin.hlx.page/status/adobe/aem-boilerplate/main?editUrl=${encodeURIComponent(getDefaultEditorEnviromentLocations('sharepoint', 'admin'))}`;
export const mockSharepointDirectoryFetchStatusSuccess = (overrides = {}) => fetchMock.get(sharepointDirectoryStatusUrl, {
  status: 200,
  body: {
    body: {
      ...defaultDirectorySharepointStatusResponse,
      ...overrides,
    },
  },
}, { overwriteRoutes: true });

export const defaultStatusEditUrl = 'glob:https://admin.hlx.page/status/adobe/aem-boilerplate/main?editUrl=*';
export const mockSharepointFetchStatusEditURLSuccess = (overrides = {}) => fetchMock.get(defaultStatusEditUrl, {
  status: 200,
  body: {
    ...defaultSharepointStatusResponse,
    ...overrides,
  },

}, { overwriteRoutes: true });

export const mockGdriveFetchStatusEditURLSuccess = (overrides = {}) => fetchMock.get(defaultStatusEditUrl, {
  status: 200,
  body: {
    ...defaultGdriveStatusResponse,
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
