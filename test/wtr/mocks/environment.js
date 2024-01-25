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

/* eslint-disable no-unused-vars */

import sinon from 'sinon';
import { appStore } from '../../../src/extension/app/store/app.js';

let stubs = [];

/**
 * Mock helix environments
 * @enum {string}
 */
const HelixMockContentType = {
  DOC: 'doc',
  SHEET: 'sheet',
  IMAGE: 'image',
  VIDEO: 'video',
  ADMIN: 'admin',
};

/**
 * Mock second level domains
 * @enum {string}
 */
const HelixSecondLevelDomains = {
  HLX: 'hlx',
  AEM: 'aem',
};

/**
 * Mock helix environments
 * @enum {string}
 */
// eslint-disable-next-line no-unused-vars
const HelixMockEnvironments = {
  INNER: 'inner',
  OUTER: 'outer',
  PROD: 'prod',
};

/**
 * Mock helix environments
 * @enum {string}
 */
const EditorMockEnvironments = {
  EDITOR: 'editor',
  ADMIN: 'admin',
};

/**
 * @typedef {HelixMockEnvironments | EditorMockEnvironments} AllEnvironments
 */

/**
 * Mock helix environments
 * @enum {string}
 */
const HelixMockContentSources = {
  SHAREPOINT: 'sharepoint',
  GDRIVE: 'gdrive',
};

/**
 * Mocks the browsers location
 * @param {Document} document The HTML document used to mock the environment
 * @param {string} location The location to mock
 */
function mockLocation(document, location) {
  const input = document.createElement('input');
  input.id = 'sidekick_test_location';
  input.value = location;
  document.body.appendChild(input);
}

/**
 * Given a content type and second level domain, returns the default environment locations
 * @param {HelixMockContentType} contentType The content type for the default environment location
 * @param {HelixSecondLevelDomains} sld The second level domain to use in the environment
 * @returns {Object | undefined}
 */
export function getDefaultHelixEnviromentLocations(contentType, sld) {
  switch (contentType) {
    case HelixMockContentType.DOC:
      return {
        inner: `https://main--aem-boilerplate--adobe.${sld}.page`,
        outer: `https://main--aem-boilerplate--adobe.${sld}.live`,
        prod: 'https://www.aemboilerplate.com',
      };
    case HelixMockContentType.SHEET:
      return {
        inner: `https://main--aem-boilerplate--adobe.${sld}.page/placeholders.json`,
        outer: `https://main--aem-boilerplate--adobe.${sld}.live/placeholders.json`,
        prod: 'https://www.aemboilerplate.com/placeholders.json',
      };
    case HelixMockContentType.IMAGE:
      return {
        inner: `https://main--aem-boilerplate--adobe.${sld}.page/media_foobar.png?width=750&format=png&optimize=medium`,
        outer: `https://main--aem-boilerplate--adobe.${sld}.live/media_foobar.png?width=750&format=png&optimize=medium`,
        prod: 'https://www.aemboilerplate.com/media_foobar.png?width=750&format=png&optimize=medium',
      };
    default:
      // eslint-disable-next-line no-console
      console.error('Invalid environment');
      return undefined;
  }
}

/**
 * Given a content type and second level domain, returns the default environment locations
 * @prop {HelixMockContentSources} contentSource The content source (Default: sharepoint)
 * @param {HelixMockContentType} contentType The content type for the default environment location
 * @returns {string | undefined}
 */
export function getDefaultEditorEnviromentLocations(contentSource, contentType) {
  switch (contentType) {
    case HelixMockContentType.DOC:
      return contentSource === HelixMockContentSources.SHAREPOINT
        ? 'https://adobe.sharepoint.com/:w:/r/sites/HelixProjects/_layouts/15/Doc.aspx?sourcedoc=ID'
        : 'https://docs.google.com/document/d/foobar/edit';
    case HelixMockContentType.SHEET:
      return contentSource === HelixMockContentSources.SHAREPOINT
        ? 'https://adobe.sharepoint.com/:x:/r/sites/HelixProjects/_layouts/15/Doc.aspx?sourcedoc=ID'
        : 'https://docs.google.com/spreadsheets/d/foobar/edit';
    case HelixMockContentType.ADMIN:
      return contentSource === HelixMockContentSources.SHAREPOINT
        ? 'https://adobe.sharepoint.com/sites/adobecom/Shared%20Documents/Forms/AllItems.aspx?cid=foobar&RootFolder=%2Fsites%2Fadobe%2FShared%20Documents%2Faem-boilerplate&FolderCTID=0x012000F36D5B4C46F81741BCAC9F03FA9F93D1'
        : 'https://drive.google.com/drive/u/0/folders/folder-id';
    default:
      // eslint-disable-next-line no-console
      console.error('Invalid content type');
      return undefined;
  }
}

/**
 * Given a helix environment, stubs the appropriate methods in appStore
 * @param {AllEnvironments} environment
 */
function stubEnvironment(environment) {
  const environments = ['inner', 'outer', 'prod', 'editor', 'admin'];
  environments.forEach((env) => {
    const method = `is${env.charAt(0).toUpperCase() + env.slice(1)}`;
    if (env === environment) {
      // @ts-ignore
      stubs.push(sinon.stub(appStore, method).returns(true));
    } else {
      // @ts-ignore
      stubs.push(sinon.stub(appStore, method).returns(false));
    }
  });
}

/**
 * Mocks a helix environment
 * @param {Document} document The HTML document used to mock the environment
 * @param {HelixMockEnvironments} environment The helix environment
 * @param {HelixMockContentType} contentType The active content type for the environment
 * @param {string} [location] Location override (Optional)
 * @param {string} [sld] Second level domain override (Optional) (Default: hlx)
 */
export function mockHelixEnvironment(
  document,
  environment = EditorMockEnvironments.EDITOR,
  contentType = HelixMockContentType.DOC,
  location = undefined,
  sld = 'hlx') {
  if (!environment) {
    throw new Error('environment is required');
  }

  // Given the environment, mock the appropriate methods in appStore
  stubEnvironment(environment);

  // Mock the browsers location
  mockLocation(
    document,
    location ?? getDefaultHelixEnviromentLocations(contentType, sld)[environment],
  );
}

/**
 * Mocks an editor/admin environment
 * @param {Document} document The HTML document used to mock the environment
 * @param {EditorMockEnvironments} [environment] The editor/admin environment (Default: editor)
 * @param {HelixMockContentType} [contentType] The document type (Default: doc)
 * @param {HelixMockContentSources} [contentSource] The content source (Default: sharepoint)
 * @param {string} [location] Location override (Optional)
 */
export function mockEditorAdminEnvironment(
  document,
  environment = EditorMockEnvironments.EDITOR,
  contentType = HelixMockContentType.DOC,
  contentSource = HelixMockContentSources.SHAREPOINT,
  location = undefined) {
  if (!environment) {
    throw new Error('environment is required');
  }

  // Given the environment, mock the appropriate methods in appStore
  stubEnvironment(environment);

  // Mock the browsers location
  mockLocation(document,
    location ?? getDefaultEditorEnviromentLocations(contentSource, contentType),
  );
}

/**
 * Restores the default environment
 * @param {Document} document The HTML document used to mock the environment
 */
export function restoreEnvironment(document) {
  stubs.forEach((stub) => stub.restore());
  stubs = [];

  // Reset location
  const input = document.getElementById('sidekick_test_location');
  if (input) {
    input.remove();
  }
}
