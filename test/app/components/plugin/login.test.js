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
import { SIDEKICK_STATE } from '../../../../src/extension/app/constants.js';
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

    sidekickTest
      .mockFetchStatusSuccess()
      .mockFetchSidekickConfigNotFound()
      .mockFetchProfileSuccess()
      .mockHelixEnvironment(HelixMockEnvironments.PREVIEW);
  });

  afterEach(() => {
    sidekickTest.destroy();
  });

  describe('Login', () => {
    async function login() {
      // @ts-ignore
      const openStub = sidekickTest.sandbox.stub(appStore, 'openPage').returns({ closed: true });

      sidekick = sidekickTest.createSidekick();
      await sidekickTest.awaitStatusFetched();

      await waitUntil(() => recursiveQuery(sidekick, 'login-button'));
      const loginButton = recursiveQuery(sidekick, 'login-button');

      const loginActionButton = recursiveQuery(loginButton, 'sp-action-button');
      await waitUntil(() => loginActionButton.getAttribute('disabled') === null);

      expect(loginActionButton).to.exist;
      expect(loginActionButton.textContent).to.eq('Sign in');

      sidekickTest
        .mockFetchStatusSuccess(true)
        .mockFetchSidekickConfigSuccess();
      loginActionButton.click();

      await waitUntil(() => appStore.state === SIDEKICK_STATE.LOGGING_IN);
      await waitUntil(() => appStore.status.profile !== undefined, 'Profile not loaded', { timeout: 10000 });

      expect(openStub.calledOnce).to.be.true;
    }

    it('Successful login ', async () => {
      await login();
      await waitUntil(() => appStore.state === SIDEKICK_STATE.READY);

      expect(setStateSpy.calledWith(SIDEKICK_STATE.FETCHING_STATUS)).to.be.true;
      expect(setStateSpy.calledWith(SIDEKICK_STATE.LOGGING_IN)).to.be.true;
    });

    it('Successful logout ', async () => {
      await login();

      const accountElement = recursiveQuery(sidekick, 'login-button');
      const accountButton = recursiveQuery(accountElement, 'sp-action-button');
      accountButton.click();

      const accountMenu = recursiveQuery(accountElement, 'sp-action-menu');
      await waitUntil(() => accountMenu.getAttribute('open') !== null);

      sidekickTest
        .mockFetchStatusUnauthorized()
        .mockFetchProfileUnauthorized();

      const logoutButton = recursiveQuery(accountMenu, 'sp-menu-item.logout');
      logoutButton.click();

      await waitUntil(() => appStore.state === SIDEKICK_STATE.LOGGING_OUT);
      await sidekickTest.awaitLoggedOut();
      await waitUntil(() => appStore.state === SIDEKICK_STATE.LOGIN_REQUIRED);
    }).timeout(20000);

    it('Unauthorized after login ', async () => {
      // @ts-ignore
      const openStub = sidekickTest.sandbox.stub(appStore, 'openPage').returns({ closed: true });

      sidekick = sidekickTest.createSidekick();
      await sidekickTest.awaitStatusFetched();

      await waitUntil(() => recursiveQuery(sidekick, 'login-button'));
      const loginButton = recursiveQuery(sidekick, 'login-button');

      const loginActionButton = recursiveQuery(loginButton, 'sp-action-button');
      await waitUntil(() => loginActionButton.getAttribute('disabled') === null);

      expect(loginActionButton).to.exist;
      expect(loginActionButton.textContent).to.eq('Sign in');

      sidekickTest
        .mockFetchProfileSuccess()
        .mockFetchStatusForbiddenWithProfile()
        .mockFetchSidekickConfigForbidden();
      loginActionButton.click();

      await waitUntil(() => appStore.state === SIDEKICK_STATE.LOGGING_IN);

      expect(openStub.calledOnce).to.be.true;
      await waitUntil(() => appStore.state === SIDEKICK_STATE.UNAUTHORIZED, '', { timeout: 10000 });
    }).timeout(20000);
  });
});
