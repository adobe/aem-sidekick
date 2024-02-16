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
import { AEMSidekick } from '../../../../src/extension/app/aem-sidekick.js';
import { mockFetchEnglishMessagesSuccess } from '../../../mocks/i18n.js';
import { defaultSidekickConfig } from '../../../fixtures/sidekick-config.js';
import {
  mockFetchConfigJSONNotFound,
  mockFetchProfileSuccess,
  mockFetchProfileUnauthorized,
  mockFetchStatusSuccess,
  mockFetchStatusWithProfileSuccess,
} from '../../../mocks/helix-admin.js';
import '../../../../src/extension/index.js';
import { appStore } from '../../../../src/extension/app/store/app.js';
import { mockHelixEnvironment, restoreEnvironment } from '../../../mocks/environment.js';
import { EventBus } from '../../../../src/extension/app/utils/event-bus.js';
import { EVENTS, MODALS } from '../../../../src/extension/app/constants.js';

// @ts-ignore
window.chrome = chromeMock;

describe('Login', () => {
  let sidekick;
  beforeEach(async () => {
    mockFetchEnglishMessagesSuccess();
  });

  afterEach(() => {
    document.body.removeChild(sidekick);
    fetchMock.reset();
    restoreEnvironment(document);
  });

  describe('Login', () => {
    async function login() {
      mockFetchStatusSuccess();
      mockFetchConfigJSONNotFound();
      mockFetchProfileSuccess();
      mockHelixEnvironment(document, 'preview');

      // @ts-ignore
      const openStub = sinon.stub(appStore, 'openPage').returns({ closed: true });
      const modalSpy = sinon.spy();
      EventBus.instance.addEventListener(EVENTS.OPEN_MODAL, modalSpy);

      sidekick = new AEMSidekick(defaultSidekickConfig);
      document.body.appendChild(sidekick);

      await waitUntil(() => recursiveQuery(sidekick, 'login-button'));
      const loginButton = recursiveQuery(sidekick, 'login-button');

      const loginActionButton = recursiveQuery(loginButton, 'sp-action-button');

      await waitUntil(() => loginActionButton.getAttribute('disabled') === null);

      expect(loginActionButton).to.exist;
      expect(loginActionButton.textContent).to.eq('Sign in');

      mockFetchStatusWithProfileSuccess();
      loginActionButton.click();

      await waitUntil(() => recursiveQuery(sidekick, 'dialog-view'));
      await waitUntil(() => recursiveQuery(sidekick, 'dialog-view') === undefined);
      await waitUntil(() => recursiveQuery(loginButton, 'sp-menu-item.user'));

      expect(modalSpy.calledOnce).to.be.true;
      expect(modalSpy.args[0][0].detail.type).to.equal(MODALS.WAIT);
      expect(openStub.calledOnce).to.be.true;

      openStub.restore();
    }

    it.skip('Successful login ', async () => {
      await login();
    }).timeout(20000);

    it('Successful logout ', async () => {
      await login();

      // @ts-ignore
      const openStub = sinon.stub(appStore, 'openPage').returns({ closed: true });
      const accountElement = recursiveQuery(sidekick, 'login-button');
      const accountButton = recursiveQuery(accountElement, 'sp-action-button');
      accountButton.click();

      const accountMenu = recursiveQuery(accountElement, 'sp-action-menu');
      await waitUntil(() => accountMenu.getAttribute('open') !== null);

      mockFetchProfileUnauthorized();
      const logoutButton = recursiveQuery(accountMenu, 'sp-menu-item.logout');
      logoutButton.click();
      await waitUntil(() => recursiveQuery(sidekick, 'dialog-view'));
      await waitUntil(() => recursiveQuery(sidekick, 'dialog-view') === undefined);
      openStub.restore();
    }).timeout(20000);
  });
});
