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
/* eslint-disable no-unused-expressions, import/no-extraneous-dependencies */

// @ts-ignore
import fetchMock from 'fetch-mock/esm/client.js';
import sinon from 'sinon';
import { expect, waitUntil } from '@open-wc/testing';
import { recursiveQuery, recursiveQueryAll } from '../../../test-utils.js';
import chromeMock from '../../../mocks/chrome.js';
import { AEMSidekick } from '../../../../../src/extension/app/aem-sidekick.js';
import { mockFetchEnglishMessagesSuccess } from '../../../fixtures/i18n.js';
import { defaultSidekickConfig } from '../../../fixtures/stubs/sidekick-config.js';
import {
  mockDirectoryFetchStatusSuccess,
  mockEditorFetchStatusSuccess,
  mockFetchConfigJSONNotFound,
  mockFetchStatusSuccess,
} from '../../../fixtures/helix-admin.js';
import '../../../../../src/extension/index.js';
import { appStore } from '../../../../../src/extension/app/store/app.js';
import { stubSharepointEditorLocation, stubSharepointDirectoryLocation, resetLocation } from '../../../mocks/browser.js';

// @ts-ignore
window.chrome = chromeMock;

describe('AEM Sidekick', () => {
  let sidekick;
  beforeEach(async () => {
    mockFetchEnglishMessagesSuccess();
  });

  afterEach(() => {
    document.body.removeChild(sidekick);
    fetchMock.reset();
    resetLocation(document);
  });

  function expectEnvPlugin(environments) {
    const actionBar = recursiveQuery(sidekick, 'action-bar');
    const envPlugin = recursiveQuery(actionBar, 'env-switcher');
    const picker = recursiveQuery(envPlugin, 'action-bar-picker');

    expect(envPlugin).to.exist;

    environments.forEach((env) => {
      const envButton = recursiveQuery(picker, `sp-menu-item.env-${env}`);
      expect(envButton).to.exist;
    });

    const menuButtons = recursiveQueryAll(picker, 'sp-menu-item');
    expect([...menuButtons].length).to.equal(environments.length);
  }

  function expectPlugin(selector) {
    const actionBar = recursiveQuery(sidekick, 'action-bar');
    const plugin = recursiveQuery(actionBar, selector);
    expect(plugin).to.exist;
  }

  function expectPluginCount(count) {
    const actionGroup = recursiveQuery(sidekick, 'sp-action-group:first-of-type');
    const plugins = recursiveQueryAll(actionGroup, 'sp-action-button, env-switcher, action-bar-picker');

    expect([...plugins].length).to.equal(count);
  }

  describe('renders correct default plugins in action bar', () => {
    it('isInner', async () => {
      mockFetchStatusSuccess();
      mockFetchConfigJSONNotFound();

      const envStub = sinon.stub(appStore, 'isInner').returns(true);

      sidekick = new AEMSidekick(defaultSidekickConfig);
      document.body.appendChild(sidekick);

      await waitUntil(() => recursiveQuery(sidekick, 'action-bar-picker'));

      expectPluginCount(2);

      expectEnvPlugin(['preview', 'edit', 'live']);

      expectPlugin('env-switcher');
      expectPlugin('.publish');

      envStub.restore();
    });

    it('isOuter', async () => {
      mockFetchStatusSuccess();
      mockFetchConfigJSONNotFound();

      const innerStub = sinon.stub(appStore, 'isInner').returns(false);
      const outerStub = sinon.stub(appStore, 'isOuter').returns(true);

      sidekick = new AEMSidekick(defaultSidekickConfig);
      document.body.appendChild(sidekick);

      await waitUntil(() => recursiveQuery(sidekick, 'action-bar-picker'));

      expectPluginCount(2);

      expectEnvPlugin(['preview', 'edit', 'live']);

      expectPlugin('env-switcher');
      expectPlugin('.publish');

      innerStub.restore();
      outerStub.restore();
    });

    it('isProd', async () => {
      mockFetchStatusSuccess();
      mockFetchConfigJSONNotFound();

      const innerStub = sinon.stub(appStore, 'isInner').returns(false);
      const outerStub = sinon.stub(appStore, 'isOuter').returns(false);
      const prodStub = sinon.stub(appStore, 'isProd').returns(true);

      sidekick = new AEMSidekick(defaultSidekickConfig);
      document.body.appendChild(sidekick);

      await waitUntil(() => recursiveQuery(sidekick, 'action-bar-picker'));

      expectPluginCount(2);

      expectEnvPlugin(['prod', 'preview', 'edit', 'live']);

      expectPlugin('env-switcher');
      expectPlugin('.publish');

      innerStub.restore();
      outerStub.restore();
      prodStub.restore();
    });

    it('isEditor', async () => {
      mockEditorFetchStatusSuccess();
      mockFetchConfigJSONNotFound();
      stubSharepointEditorLocation(document);

      const innerStub = sinon.stub(appStore, 'isInner').returns(false);
      const outerStub = sinon.stub(appStore, 'isOuter').returns(false);
      const prodStub = sinon.stub(appStore, 'isProd').returns(false);
      const editorStub = sinon.stub(appStore, 'isEditor').returns(true);

      sidekick = new AEMSidekick(defaultSidekickConfig);
      document.body.appendChild(sidekick);

      sidekick.appendChild(document.createElement('div'));

      await waitUntil(() => recursiveQuery(sidekick, 'action-bar-picker'));

      expectPluginCount(2);

      expectEnvPlugin(['preview', 'live']);

      expectPlugin('env-switcher');
      expectPlugin('.edit-preview');

      innerStub.restore();
      outerStub.restore();
      prodStub.restore();
      editorStub.restore();
    });

    it('isAdmin', async () => {
      mockDirectoryFetchStatusSuccess();
      mockFetchConfigJSONNotFound();
      stubSharepointDirectoryLocation(document);

      const innerStub = sinon.stub(appStore, 'isInner').returns(false);
      const outerStub = sinon.stub(appStore, 'isOuter').returns(false);
      const prodStub = sinon.stub(appStore, 'isProd').returns(false);
      const adminStub = sinon.stub(appStore, 'isAdmin').returns(true);

      sidekick = new AEMSidekick(defaultSidekickConfig);
      document.body.appendChild(sidekick);

      await waitUntil(() => recursiveQuery(sidekick, 'action-bar-picker'));

      // TODO: Expand tests when bulk plugin is added
      expectPluginCount(1);

      expectEnvPlugin([]);

      expectPlugin('env-switcher');

      innerStub.restore();
      outerStub.restore();
      prodStub.restore();
      adminStub.restore();
    });
  });
});
