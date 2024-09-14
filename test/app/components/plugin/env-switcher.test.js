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

import { expect, waitUntil } from '@open-wc/testing';
import { sendKeys } from '@web/test-runner-commands';
import { recursiveQuery } from '../../../test-utils.js';
import chromeMock from '../../../mocks/chrome.js';
import { defaultSidekickConfig } from '../../../fixtures/sidekick-config.js';
import '../../../../src/extension/index.js';
import { AppStore } from '../../../../src/extension/app/store/app.js';
import {
  EditorMockEnvironments,
  HelixMockContentSources,
  HelixMockContentType,
  HelixMockEnvironments,
} from '../../../mocks/environment.js';
import { SidekickTest } from '../../../sidekick-test.js';

/**
 * The AEMSidekick object type
 * @typedef {import('../../../../src/extension/app/aem-sidekick.js').AEMSidekick} AEMSidekick
 */

// @ts-ignore
window.chrome = chromeMock;

describe('Environment Switcher', () => {
  /**
   * @type {SidekickTest}
   */
  let sidekickTest;

  /**
   * @type {AEMSidekick}
   */
  let sidekick;

  /**
   * @type {AppStore}
   */
  let appStore;

  beforeEach(async () => {
    appStore = new AppStore();
    sidekickTest = new SidekickTest(defaultSidekickConfig, appStore);

    sidekickTest
      .mockFetchSidekickConfigSuccess(true, false);
  });

  afterEach(() => {
    sidekickTest.destroy();
  });

  describe('switching between environments', () => {
    it('preview -> live', async () => {
      sidekickTest
        .mockFetchStatusSuccess()
        .mockFetchSidekickConfigSuccess(false)
        .mockHelixEnvironment(HelixMockEnvironments.PREVIEW);

      sidekick = sidekickTest.createSidekick();

      await sidekickTest.awaitEnvSwitcher();

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

      const switchEnvStub = sidekickTest.sandbox.stub(appStore, 'switchEnv').resolves();
      const liveButton = recursiveQuery(picker, 'sk-menu-item.env-live');
      liveButton.click();

      picker.value = 'live';
      picker.dispatchEvent(new Event('change'));

      expect(switchEnvStub.called).to.be.true;
      expect(switchEnvStub.calledWith('live', false)).to.be.true;
      expect(sidekickTest.rumStub.called).to.be.true;
      expect(sidekickTest.rumStub.calledWith('click', {
        source: 'sidekick',
        target: 'env-switched:live',
      })).to.be.true;
    }).timeout(20000);

    it('edit -> preview - with special views', async () => {
      sidekickTest
        .mockFetchSidekickConfigSuccess(false)
        .mockFetchEditorStatusSuccess(
          HelixMockContentSources.SHAREPOINT,
          HelixMockContentType.SHEET,
        )
        .mockEditorAdminEnvironment(
          EditorMockEnvironments.EDITOR,
          HelixMockContentType.SHEET,
        )
        .mockFetchSidekickConfigSuccess(true, false, {
          specialViews: [
            {
              path: '**.json',
              viewer: '/tools/sidekick/example/index.html',
              title: 'JSON',
            },
          ],
        });

      sidekick = sidekickTest.createSidekick();

      await sidekickTest.awaitEnvSwitcher();

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

      const openPageStub = sidekickTest.sandbox.stub(appStore, 'openPage').returns(null);
      const previewButton = recursiveQuery(picker, 'sk-menu-item.env-preview');
      previewButton.click();

      picker.value = 'preview';
      picker.dispatchEvent(new Event('change'));

      expect(openPageStub.called).to.be.true;
      expect(openPageStub.calledWith('https://custom-preview-host.com/tools/sidekick/example/index.html?path=%2Fplaceholders.json')).to.be.true;
      expect(sidekickTest.rumStub.called).to.be.true;
      expect(sidekickTest.rumStub.calledWith('click', {
        source: 'sidekick',
        target: 'env-switched:preview',
      })).to.be.true;
    });

    it('change environment - preview -> live (with meta key)', async () => {
      sidekickTest
        .mockFetchStatusSuccess()
        .mockFetchSidekickConfigSuccess(false)
        .mockHelixEnvironment(HelixMockEnvironments.PREVIEW);

      sidekick = sidekickTest.createSidekick();

      await sidekickTest.awaitEnvSwitcher();

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

      const switchEnvStub = sidekickTest.sandbox.stub(appStore, 'switchEnv').resolves();
      const liveButton = recursiveQuery(picker, 'sk-menu-item.env-live');
      liveButton.click();

      picker.value = 'live';
      picker.dispatchEvent(new Event('change'));

      // Simulate releasing the key
      await sendKeys({ up: 'Meta' });

      expect(switchEnvStub.called).to.be.true;
      expect(switchEnvStub.calledWith('live', true)).to.be.true;
      expect(sidekickTest.rumStub.called).to.be.true;
      expect(sidekickTest.rumStub.calledWith('click', {
        source: 'sidekick',
        target: 'env-switched:live',
      })).to.be.true;
    }).timeout(20000);
  });
});
