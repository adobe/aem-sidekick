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
import { recursiveQuery } from '../../../test-utils.js';
import chromeMock from '../../../mocks/chrome.js';
import { AEMSidekick } from '../../../../../src/extension/app/aem-sidekick.js';
import { mockFetchEnglishMessagesSuccess } from '../../../fixtures/i18n.js';
import { defaultSidekickConfig } from '../../../fixtures/stubs/sidekick-config.js';
import {
  mockFetchConfigJSONNotFound,
  mockFetchStatusSuccess,
} from '../../../fixtures/helix-admin.js';
import '../../../../../src/extension/index.js';
import { appStore } from '../../../../../src/extension/app/store/app.js';
import { mockEnvironment, restoreEnvironment } from '../../../mocks/environment.js';

// @ts-ignore
window.chrome = chromeMock;

describe('Environment Switcher', () => {
  let sidekick;
  beforeEach(async () => {
    mockFetchEnglishMessagesSuccess();
  });

  afterEach(() => {
    document.body.removeChild(sidekick);
    fetchMock.reset();
    restoreEnvironment(document);
  });

  describe('switching between environments', () => {
    it('change environment - inner -> live', async () => {
      mockFetchStatusSuccess();
      mockFetchConfigJSONNotFound();
      mockEnvironment(document, 'inner');

      const switchEnvStub = sinon.stub(appStore, 'switchEnv').resolves();

      sidekick = new AEMSidekick(defaultSidekickConfig);
      document.body.appendChild(sidekick);

      await waitUntil(() => recursiveQuery(sidekick, 'action-bar-picker'));

      const actionBar = recursiveQuery(sidekick, 'action-bar');
      const envPlugin = recursiveQuery(actionBar, 'env-switcher');
      const picker = recursiveQuery(envPlugin, 'action-bar-picker');
      const button = recursiveQuery(picker, '#button');

      button.dispatchEvent(new Event('click'));

      await waitUntil(() => recursiveQuery(picker, 'sp-popover'));

      const liveButton = recursiveQuery(picker, 'sp-menu-item.env-live');
      liveButton.dispatchEvent(new Event('click'));

      picker.value = 'live';
      picker.dispatchEvent(new Event('change'));

      expect(switchEnvStub.calledOnce).to.be.true;
      expect(switchEnvStub.calledWith('live', false)).to.be.true;

      switchEnvStub.restore();
    });
  });
});
