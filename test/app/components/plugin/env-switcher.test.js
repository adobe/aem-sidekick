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
import { sendKeys } from '@web/test-runner-commands';
import { recursiveQuery } from '../../../test-utils.js';
import chromeMock from '../../../mocks/chrome.js';
import { AEMSidekick } from '../../../../src/extension/app/aem-sidekick.js';
import { mockFetchEnglishMessagesSuccess } from '../../../mocks/i18n.js';
import { defaultSidekickConfig } from '../../../fixtures/sidekick-config.js';
import {
  mockFetchConfigWithoutPluginsJSONSuccess,
  mockFetchConfigWithoutPluginsOrHostJSONSuccess,
  mockFetchStatusSuccess,
  mockSharepointEditorSheetFetchStatusSuccess,
} from '../../../mocks/helix-admin.js';
import '../../../../src/extension/index.js';
import { appStore } from '../../../../src/extension/app/store/app.js';
import { mockEditorAdminEnvironment, mockHelixEnvironment, restoreEnvironment } from '../../../mocks/environment.js';

// @ts-ignore
window.chrome = chromeMock;

describe('Environment Switcher', () => {
  let sidekick;
  let sandbox;
  beforeEach(async () => {
    mockFetchEnglishMessagesSuccess();
    mockFetchConfigWithoutPluginsOrHostJSONSuccess();
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    if (document.body.contains(sidekick)) {
      document.body.removeChild(sidekick);
    }
    fetchMock.reset();
    restoreEnvironment(document);
    sandbox.restore();
  });

  describe('switching between environments', () => {
    it('preview -> live', async () => {
      mockFetchStatusSuccess();
      mockHelixEnvironment(document, 'preview');

      sidekick = new AEMSidekick(defaultSidekickConfig);
      document.body.appendChild(sidekick);

      await waitUntil(() => recursiveQuery(sidekick, 'action-bar-picker'));

      const actionBar = recursiveQuery(sidekick, 'action-bar');
      const envPlugin = recursiveQuery(actionBar, 'env-switcher');
      const picker = recursiveQuery(envPlugin, 'action-bar-picker');
      const button = recursiveQuery(picker, '#button');
      await waitUntil(() => button.getAttribute('disabled') === null);

      button.click();

      await waitUntil(() => recursiveQuery(picker, 'sp-popover'), null, { timeout: 10000 });

      const overlay = recursiveQuery(picker, 'sp-overlay');

      expect(picker.getAttribute('open')).to.not.be.null;
      expect(overlay.getAttribute('open')).to.not.be.null;

      const switchEnvStub = sandbox.stub(appStore, 'switchEnv').returns();
      const liveButton = recursiveQuery(picker, 'sp-menu-item.env-live');
      liveButton.click();

      picker.value = 'live';
      picker.dispatchEvent(new Event('change'));

      expect(switchEnvStub.called).to.be.true;
      expect(switchEnvStub.calledWith('live', false)).to.be.true;
    }).timeout(20000);

    it('edit -> preview - with special views', async () => {
      mockFetchConfigWithoutPluginsJSONSuccess({
        specialViews: [
          {
            path: '**.json',
            viewer: '/tools/sidekick/example/index.html',
            title: 'JSON',
          },
        ],
      });
      mockSharepointEditorSheetFetchStatusSuccess();

      mockEditorAdminEnvironment(document, 'editor', 'sheet');

      sidekick = new AEMSidekick(defaultSidekickConfig);
      document.body.appendChild(sidekick);

      await waitUntil(() => recursiveQuery(sidekick, 'action-bar-picker'));

      const actionBar = recursiveQuery(sidekick, 'action-bar');
      const envPlugin = recursiveQuery(actionBar, 'env-switcher');
      const picker = recursiveQuery(envPlugin, 'action-bar-picker');
      const button = recursiveQuery(picker, '#button');
      await waitUntil(() => button.getAttribute('disabled') === null);

      button.click();

      await waitUntil(() => recursiveQuery(picker, 'sp-popover'), null, { timeout: 10000 });

      const overlay = recursiveQuery(picker, 'sp-overlay');

      expect(picker.getAttribute('open')).to.not.be.null;
      expect(overlay.getAttribute('open')).to.not.be.null;

      const openPageStub = sandbox.stub(appStore, 'openPage').returns(null);
      const previewButton = recursiveQuery(picker, 'sp-menu-item.env-preview');
      previewButton.click();

      picker.value = 'preview';
      picker.dispatchEvent(new Event('change'));

      expect(openPageStub.called).to.be.true;
      expect(openPageStub.calledWith('https://custom-preview-host.com/tools/sidekick/example/index.html?path=%2Fplaceholders.json')).to.be.true;
    });

    it('change environment - preview -> live (with meta key)', async () => {
      mockFetchStatusSuccess();
      mockHelixEnvironment(document, 'preview');

      sidekick = new AEMSidekick(defaultSidekickConfig);
      document.body.appendChild(sidekick);

      await waitUntil(() => recursiveQuery(sidekick, 'action-bar-picker'));

      const actionBar = recursiveQuery(sidekick, 'action-bar');
      const envPlugin = recursiveQuery(actionBar, 'env-switcher');
      const picker = recursiveQuery(envPlugin, 'action-bar-picker');
      const button = recursiveQuery(picker, '#button');
      await waitUntil(() => button.getAttribute('disabled') === null);

      button.click();

      await waitUntil(() => recursiveQuery(picker, 'sp-popover'));

      const overlay = recursiveQuery(picker, 'sp-overlay');

      expect(picker.getAttribute('open')).to.not.be.null;
      expect(overlay.getAttribute('open')).to.not.be.null;

      // Simulate pressing the key
      await sendKeys({ down: 'Meta' });

      const switchEnvStub = sandbox.stub(appStore, 'switchEnv').returns();
      const liveButton = recursiveQuery(picker, 'sp-menu-item.env-live');
      liveButton.click();

      picker.value = 'live';
      picker.dispatchEvent(new Event('change'));

      // Simulate releasing the key
      await sendKeys({ up: 'Meta' });

      expect(switchEnvStub.called).to.be.true;
      expect(switchEnvStub.calledWith('live', true)).to.be.true;
    }).timeout(20000);

    it('live out of date - should show status light', async () => {
      mockFetchStatusSuccess({
        preview: {
          lastModified: 'Tue, 19 Dec 2024 15:42:34 GMT',
          sourceLastModified: 'Wed, 01 Nov 2024 17:22:52 GMT',
        },
        live: {
          status: 200,
          lastModified: 'Tue, 12 Dec 2024 15:42:34 GMT',
        },
      });
      mockHelixEnvironment(document, 'preview');

      sidekick = new AEMSidekick(defaultSidekickConfig);
      document.body.appendChild(sidekick);

      await waitUntil(() => recursiveQuery(sidekick, 'action-bar-picker'));

      const actionBar = recursiveQuery(sidekick, 'action-bar');
      const envPlugin = recursiveQuery(actionBar, 'env-switcher');
      const picker = recursiveQuery(envPlugin, 'action-bar-picker');

      await waitUntil(() => recursiveQuery(picker, 'sp-menu-item.env-live'));

      const liveMenuItem = recursiveQuery(picker, 'sp-menu-item.env-live');
      expect(liveMenuItem.getAttribute('update')).to.eq('true');
    });
  });
});
