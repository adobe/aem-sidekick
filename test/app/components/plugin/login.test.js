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
import { recursiveQuery } from '../../../test-utils.js';
import chromeMock from '../../../mocks/chrome.js';
import { defaultSidekickConfig } from '../../../fixtures/sidekick-config.js';
import '../../../../src/extension/index.js';
import { AppStore } from '../../../../src/extension/app/store/app.js';
import { HelixMockEnvironments } from '../../../mocks/environment.js';
import { STATE } from '../../../../src/extension/app/constants.js';
import { SidekickTest } from '../../../sidekick-test.js';

/**
 * The AEMSidekick object type
 * @typedef {import('../../../../src/extension/app/aem-sidekick.js').AEMSidekick} AEMSidekick
 */

// @ts-ignore
window.chrome = chromeMock;

describe('Login', () => {
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

  let setStateSpy;

  beforeEach(async () => {
    appStore = new AppStore();
    sidekickTest = new SidekickTest(defaultSidekickConfig, appStore);

    setStateSpy = sidekickTest.sandbox.spy(appStore, 'setState');
    sidekickTest.sandbox.stub(appStore, 'reloadPage');

    sidekickTest
      .mockHelixEnvironment(HelixMockEnvironments.PREVIEW);
  });

  afterEach(() => {
    sidekickTest.destroy();
  });

  describe('Login/Logout', () => {
    async function login() {
      // @ts-ignore
      const openStub = sidekickTest.sandbox.stub(appStore, 'openPage').returns({ closed: true });

      await waitUntil(() => recursiveQuery(sidekick, 'login-button'));
      const loginButton = recursiveQuery(sidekick, 'login-button');

      const loginActionButton = recursiveQuery(loginButton, 'sp-action-button');
      await waitUntil(() => loginActionButton.getAttribute('disabled') === null);

      sidekickTest
        .mockFetchStatusSuccess(true)
        .mockFetchSidekickConfigSuccess()
        .mockFetchProfilePictureSuccess()
        .mockFetchProfileSuccess();

      expect(loginActionButton).to.exist;
      expect(loginActionButton.textContent).to.eq('Sign in');
      loginActionButton.click();

      await waitUntil(() => appStore.state === STATE.LOGGING_IN);
      await waitUntil(() => appStore.status.profile !== undefined, 'Profile not loaded', { timeout: 10000 });

      expect(openStub.calledOnce).to.be.true;
    }

    it('Successful login and logout with authentication enabled ', async () => {
      sidekickTest
        .mockFetchStatusUnauthorized()
        .mockFetchProfilePictureSuccess()
        .mockFetchSidekickConfigUnauthorized();

      sidekick = sidekickTest.createSidekick();
      await sidekickTest.awaitActionBar();

      await waitUntil(() => appStore.state === STATE.LOGIN_REQUIRED);

      await login();
      await waitUntil(() => appStore.state === STATE.READY);

      expect(setStateSpy.calledWith(STATE.FETCHING_STATUS)).to.be.true;
      expect(setStateSpy.calledWith(STATE.LOGGING_IN)).to.be.true;

      const accountElement = recursiveQuery(sidekick, 'login-button');
      const accountButton = recursiveQuery(accountElement, 'sp-action-button');
      accountButton.click();

      const accountMenu = recursiveQuery(accountElement, 'sp-action-menu');
      await waitUntil(() => accountMenu.getAttribute('open') !== null);

      sidekickTest
        .mockFetchStatusUnauthorized()
        .mockFetchSidekickConfigUnauthorized()
        .mockFetchProfilePictureSuccess()
        .mockFetchProfileUnauthorized();

      const logoutButton = recursiveQuery(accountMenu, 'sk-menu-item.logout');
      logoutButton.click();

      await waitUntil(() => appStore.state === STATE.LOGGING_OUT);
      await sidekickTest.awaitLoggedOut();
      await waitUntil(() => appStore.state === STATE.LOGIN_REQUIRED);
    }).timeout(20000);

    it('Successful login and logout without authentication enabled ', async () => {
      sidekickTest
        .mockFetchStatusSuccess()
        .mockFetchProfilePictureSuccess()
        .mockFetchSidekickConfigSuccess();

      sidekick = sidekickTest.createSidekick();
      await sidekickTest.awaitStatusFetched();

      await waitUntil(() => appStore.state === STATE.READY);
      await login();
      await waitUntil(() => appStore.state === STATE.READY);

      expect(setStateSpy.calledWith(STATE.FETCHING_STATUS)).to.be.true;
      expect(setStateSpy.calledWith(STATE.LOGGING_IN)).to.be.true;

      const accountElement = recursiveQuery(sidekick, 'login-button');
      const accountButton = recursiveQuery(accountElement, 'sp-action-button');
      accountButton.click();

      const accountMenu = recursiveQuery(accountElement, 'sp-action-menu');
      await waitUntil(() => accountMenu.getAttribute('open') !== null);

      sidekickTest
        .mockFetchStatusSuccess()
        .mockFetchProfileUnauthorized();

      const logoutButton = recursiveQuery(accountMenu, 'sk-menu-item.logout');
      logoutButton.click();

      await waitUntil(() => appStore.state === STATE.LOGGING_OUT);
      await sidekickTest.awaitLoggedOut();
      await waitUntil(() => appStore.state === STATE.READY);
    }).timeout(20000);

    it('Successful login and logout with authentication enabled ', async () => {
      sidekickTest
        .mockFetchStatusSuccess()
        .mockFetchProfilePictureSuccess()
        .mockFetchSidekickConfigSuccess();

      sidekick = sidekickTest.createSidekick();
      await sidekickTest.awaitStatusFetched();

      await waitUntil(() => appStore.state === STATE.READY);
      await login();
      await waitUntil(() => appStore.state === STATE.READY);

      expect(setStateSpy.calledWith(STATE.FETCHING_STATUS)).to.be.true;
      expect(setStateSpy.calledWith(STATE.LOGGING_IN)).to.be.true;

      const accountElement = recursiveQuery(sidekick, 'login-button');
      const accountButton = recursiveQuery(accountElement, 'sp-action-button');
      accountButton.click();

      const accountMenu = recursiveQuery(accountElement, 'sp-action-menu');
      await waitUntil(() => accountMenu.getAttribute('open') !== null);

      sidekickTest
        .mockFetchStatusSuccess()
        .mockFetchProfileUnauthorized();

      const logoutButton = recursiveQuery(accountMenu, 'sk-menu-item.logout');
      logoutButton.click();

      await waitUntil(() => appStore.state === STATE.LOGGING_OUT);
      await sidekickTest.awaitLoggedOut();
      await waitUntil(() => appStore.state === STATE.READY);
    }).timeout(20000);

    it('Displays profile picture after login', async () => {
      const profilePicture = 'data:image/png;base64,profile-picture';
      const sendMessageStub = sidekickTest.sandbox.stub(chrome.runtime, 'sendMessage');
      sendMessageStub.resolves(profilePicture);

      sidekickTest
        .mockFetchStatusUnauthorized()
        .mockFetchProfilePictureSuccess()
        .mockFetchSidekickConfigUnauthorized();

      sidekick = sidekickTest.createSidekick();

      await waitUntil(() => appStore.state === STATE.LOGIN_REQUIRED);

      await login();
      await waitUntil(() => appStore.state === STATE.READY);

      expect(sendMessageStub.calledWith({
        // @ts-ignore
        action: 'getProfilePicture',
        owner: appStore.siteStore.owner,
      })).to.be.true;

      const profilePictureElement = recursiveQuery(sidekick, 'sp-icon.picture > img');
      expect(profilePictureElement).to.exist;
      expect(profilePictureElement.getAttribute('src')).to.equal(profilePicture);
    }).timeout(20000);

    it('Unauthorized after login ', async () => {
      sidekickTest
        .mockFetchStatusUnauthorized()
        .mockFetchSidekickConfigUnauthorized();

      // @ts-ignore
      const openStub = sidekickTest.sandbox.stub(appStore, 'openPage').returns({ closed: true });

      sidekick = sidekickTest.createSidekick();

      await waitUntil(() => recursiveQuery(sidekick, 'login-button'));
      const loginButton = recursiveQuery(sidekick, 'login-button');

      const loginActionButton = recursiveQuery(loginButton, 'sp-action-button');
      await waitUntil(() => loginActionButton.getAttribute('disabled') === null);

      expect(loginActionButton).to.exist;
      expect(loginActionButton.textContent).to.eq('Sign in');

      sidekickTest
        .mockFetchProfileSuccess()
        .mockFetchProfilePictureSuccess()
        .mockFetchStatusForbiddenWithProfile()
        .mockFetchSidekickConfigForbidden();
      loginActionButton.click();

      await waitUntil(() => appStore.state === STATE.LOGGING_IN);

      expect(openStub.calledOnce).to.be.true;
      await waitUntil(() => appStore.state === STATE.UNAUTHORIZED, '', { timeout: 10000 });
    }).timeout(20000);
  });
});
