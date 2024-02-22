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
import { AEMSidekick } from '../../../../src/extension/app/aem-sidekick.js';
import { mockFetchEnglishMessagesSuccess } from '../../../mocks/i18n.js';
import { defaultSidekickConfig } from '../../../fixtures/sidekick-config.js';
import {
  mockFetchConfigWithoutPluginsOrHostJSONSuccess,
  mockFetchStatusSuccess,
  mockFetchStatusWithProfileUnauthorized,
} from '../../../mocks/helix-admin.js';
import '../../../../src/extension/index.js';
import { appStore } from '../../../../src/extension/app/store/app.js';
import { mockHelixEnvironment, restoreEnvironment } from '../../../mocks/environment.js';

// @ts-ignore
window.chrome = chromeMock;

describe('Environment Switcher', () => {
  let sidekick;
  beforeEach(async () => {
    mockFetchEnglishMessagesSuccess();
    mockFetchConfigWithoutPluginsOrHostJSONSuccess();
  });

  afterEach(() => {
    document.body.removeChild(sidekick);
    fetchMock.reset();
    restoreEnvironment(document);
  });

  describe('switching between environments', () => {
    it('change environment - preview -> live', async () => {
      mockFetchStatusSuccess();
      mockHelixEnvironment(document, 'preview');

      const switchEnvStub = sinon.stub(appStore, 'switchEnv').returns();

      sidekick = new AEMSidekick(defaultSidekickConfig);
      document.body.appendChild(sidekick);

      await waitUntil(() => recursiveQuery(sidekick, 'action-bar-picker'));

      const actionBar = recursiveQuery(sidekick, 'action-bar');
      const envPlugin = recursiveQuery(actionBar, 'env-switcher');
      const picker = recursiveQuery(envPlugin, 'action-bar-picker');
      const button = recursiveQuery(picker, '#button');

      button.click();

      await waitUntil(() => recursiveQuery(picker, 'sp-popover'));

      const liveButton = recursiveQuery(picker, 'sp-menu-item.env-live');
      liveButton.click();

      picker.value = 'live';
      picker.dispatchEvent(new Event('change'));

      expect(switchEnvStub.calledOnce).to.be.true;
      expect(switchEnvStub.calledWith('live', false)).to.be.true;

      switchEnvStub.restore();
    }).timeout(20000);

    it('live out of date - should show status light', async () => {
      mockFetchStatusSuccess({
        preview: {
          lastModified: 'Tue, 19 Dec 2024 15:42:34 GMT',
          sourceLastModified: 'Wed, 01 Nov 2024 17:22:52 GMT',
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
    }).timeout(20000);

    it('not authorized - authenticated but not authorized', async () => {
      mockFetchStatusWithProfileUnauthorized();
      mockHelixEnvironment(document, 'preview');

      sidekick = new AEMSidekick(defaultSidekickConfig);
      document.body.appendChild(sidekick);

      await waitUntil(() => recursiveQuery(sidekick, 'action-bar-picker'));

      const actionBar = recursiveQuery(sidekick, 'action-bar');
      const envPlugin = recursiveQuery(actionBar, 'env-switcher');
      const picker = recursiveQuery(envPlugin, 'action-bar-picker');
      const menuItems = [...recursiveQueryAll(picker, 'sp-menu-item')];

      menuItems.forEach((item) => {
        expect(item.disabled).to.eq(true);
        expect(item.querySelector('span').textContent).to.eq('Not authorized');
      });
    });
  });
});
