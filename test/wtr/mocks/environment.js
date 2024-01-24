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

import sinon from 'sinon';
import { appStore } from '../../../src/extension/app/store/app.js';

let innerStub;
let outerStub;
let prodStub;
let editorStub;
let adminStub;

function mockLocation(document, location) {
  const input = document.createElement('input');
  input.id = 'sidekick_test_location';
  input.value = location;
  document.body.appendChild(input);
}

export function resetLocation(document) {
  const input = document.getElementById('sidekick_test_location');
  if (input) {
    input.remove();
  }
}

export const sharepointEditorUrl = 'https://adobe.sharepoint.com/:w:/r/sites/HelixProjects/_layouts/15/Doc.aspx?sourcedoc=ID';
export function mockSharepointEditorLocation(document, location = sharepointEditorUrl) {
  mockLocation(document, location);
}

export const sharepointDirectoryUrl = 'https://adobe-my.sharepoint.com/personal/user_name/_layouts/15/onedrive.aspx?id=%2Fsites%2Fadobe%2FShared%20Documents%2Faem-boilerplate&listurl=https%3A%2F%2Fadobe%2Esharepoint%2Ecom%2Fsites%2Fadobe%2FShared%20Documents&viewid=d776cf70%2D9b7e%2D4ab7%2Db9da%2D9e0f8e03a7d2&view=0D';
export function mockSharepointDirectoryLocation(document, location = sharepointDirectoryUrl) {
  mockLocation(document, location);
}

export const prodUrl = 'https://www.aemboilerplate.com';
export function mockProdLocation(document, location = prodUrl) {
  mockLocation(document, location);
}

export const innerUrl = 'https://main--aem-boilerplate--adobe.hlx.page';
export function mockInnerLocation(document, location = innerUrl) {
  mockLocation(document, location);
}

export const outerUrl = 'https://main--aem-boilerplate--adobe.hlx.live';
export function mockOuterLocation(document, location = outerUrl) {
  mockLocation(document, location);
}

export function mockEnvironment(document, environment) {
  switch (environment) {
    case 'inner':
      innerStub = sinon.stub(appStore, 'isInner').returns(true);
      outerStub = sinon.stub(appStore, 'isOuter').returns(false);
      prodStub = sinon.stub(appStore, 'isProd').returns(false);
      editorStub = sinon.stub(appStore, 'isEditor').returns(false);
      adminStub = sinon.stub(appStore, 'isAdmin').returns(false);
      mockInnerLocation(document);
      break;
    case 'outer':
      innerStub = sinon.stub(appStore, 'isInner').returns(false);
      outerStub = sinon.stub(appStore, 'isOuter').returns(true);
      prodStub = sinon.stub(appStore, 'isProd').returns(false);
      editorStub = sinon.stub(appStore, 'isEditor').returns(false);
      adminStub = sinon.stub(appStore, 'isAdmin').returns(false);
      mockOuterLocation(document);
      break;
    case 'prod':
      innerStub = sinon.stub(appStore, 'isInner').returns(false);
      outerStub = sinon.stub(appStore, 'isOuter').returns(false);
      prodStub = sinon.stub(appStore, 'isProd').returns(true);
      editorStub = sinon.stub(appStore, 'isEditor').returns(false);
      adminStub = sinon.stub(appStore, 'isAdmin').returns(false);
      mockProdLocation(document);
      break;
    case 'editor':
      innerStub = sinon.stub(appStore, 'isInner').returns(false);
      outerStub = sinon.stub(appStore, 'isOuter').returns(false);
      prodStub = sinon.stub(appStore, 'isProd').returns(false);
      editorStub = sinon.stub(appStore, 'isEditor').returns(true);
      adminStub = sinon.stub(appStore, 'isAdmin').returns(false);
      mockSharepointEditorLocation(document);
      break;
    case 'admin':
      innerStub = sinon.stub(appStore, 'isInner').returns(false);
      outerStub = sinon.stub(appStore, 'isOuter').returns(false);
      prodStub = sinon.stub(appStore, 'isProd').returns(false);
      editorStub = sinon.stub(appStore, 'isEditor').returns(false);
      adminStub = sinon.stub(appStore, 'isAdmin').returns(true);
      mockSharepointDirectoryLocation(document);
      break;
    default:
      // eslint-disable-next-line no-console
      console.error('Invalid environment');
  }
}

export function restoreEnvironment(document) {
  innerStub.restore();
  outerStub.restore();
  prodStub.restore();
  editorStub.restore();
  adminStub.restore();
  resetLocation(document);
}
