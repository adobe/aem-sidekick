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
import { aTimeout, expect, waitUntil } from '@open-wc/testing';
import { appStore } from '../../../../src/extension/app/store/app.js';
import { recursiveQuery } from '../../../test-utils.js';
import chromeMock from '../../../mocks/chrome.js';
import { AEMSidekick } from '../../../../src/extension/app/aem-sidekick.js';
import { mockFetchEnglishMessagesSuccess } from '../../../mocks/i18n.js';
import {
  mockFetchConfigWithoutPluginsOrHostJSONSuccess,
  mockFetchStatusSuccess,
  mockSharepointEditorDocFetchStatusSuccess,
} from '../../../mocks/helix-admin.js';
import '../../../../src/extension/index.js';
import { mockEditorAdminEnvironment, restoreEnvironment } from '../../../mocks/environment.js';

// @ts-ignore
window.chrome = chromeMock;

describe('Environment Switcher', () => {
  let sidekick;
  beforeEach(async () => {
    mockFetchEnglishMessagesSuccess();
    mockFetchConfigWithoutPluginsOrHostJSONSuccess();
  });

  afterEach(() => {
    const { body } = document;
    if (body.contains(sidekick)) {
      body.removeChild(sidekick);
    }
    fetchMock.reset();
    restoreEnvironment(document);
  });

  describe('switching between configs', () => {
    it('change config', async () => {
      const configs = [{
        giturl: 'https://github.com/adobe/aem-boilerplate/tree/main',
        id: 'adobe/aem-boilerplate/main',
        mountpoints: [
          'https://adobe.sharepoint.com/:f:/r/sites/HelixProjects/Shared%20Documents/sites/aem-boilerplate',
        ],
        owner: 'adobe',
        ref: 'main',
        repo: 'aem-boilerplate',
      }, {
        giturl: 'https://github.com/owner2/aem-boilerplate/tree/main',
        id: 'owner2/aem-boilerplate/main',
        mountpoints: [
          'https://adobe.sharepoint.com/:f:/r/sites/HelixProjects/Shared%20Documents/sites/aem-boilerplate',
        ],
        owner: 'owner2',
        ref: 'main',
        repo: 'aem-boilerplate',
      }];
      mockFetchStatusSuccess();
      mockSharepointEditorDocFetchStatusSuccess();
      mockEditorAdminEnvironment(document, 'editor');

      window.sessionStorage.setItem('hlx-sk-project', JSON.stringify(configs[0]));
      window.sessionStorage.setItem('hlx-sk-project-matched', JSON.stringify(configs));

      sidekick = new AEMSidekick(configs[0]);
      document.body.appendChild(sidekick);

      await waitUntil(() => recursiveQuery(sidekick, 'action-bar-picker'));

      const actionBar = recursiveQuery(sidekick, 'action-bar');
      const envPlugin = recursiveQuery(actionBar, 'config-switcher');
      const picker = recursiveQuery(envPlugin, 'action-bar-picker');
      const button = recursiveQuery(picker, '#button');

      expect(button.innerText).to.equal('aem-boilerplate');

      button.click();

      await waitUntil(() => recursiveQuery(picker, 'sp-popover'), undefined, {
        timeout: 2000,
      });

      const overlay = recursiveQuery(picker, 'sp-overlay');

      expect(picker.getAttribute('open')).to.not.be.null;
      expect(overlay.getAttribute('open')).to.not.be.null;

      const initStoreSpy = sinon.spy(appStore.siteStore, 'initStore');

      picker.value = 'owner2/aem-boilerplate/main';
      picker.dispatchEvent(new Event('change'));

      await aTimeout(1000);

      const newSelectedConfig = window.sessionStorage.getItem('hlx-sk-project');
      expect(newSelectedConfig).to.deep.equal(JSON.stringify(configs[1]));
      expect(initStoreSpy.calledOnce).to.be.true;

      initStoreSpy.restore();
      window.sessionStorage.setItem('hlx-sk-project', JSON.stringify({}));
      window.sessionStorage.setItem('hlx-sk-project-matched', JSON.stringify([]));
    }).timeout(10000);
  });
});
