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

/* eslint-disable no-unused-expressions, import/no-extraneous-dependencies, max-len */

// @ts-ignore
import {
  expect,
  waitUntil,
} from '@open-wc/testing';
import { AppStore } from '../../../../src/extension/app/store/app.js';
import chromeMock from '../../../mocks/chrome.js';
import { recursiveQuery, recursiveQueryAll } from '../../../test-utils.js';
import { HelixMockEnvironments } from '../../../mocks/environment.js';
import { defaultSidekickConfig } from '../../../fixtures/sidekick-config.js';
import { SidekickTest } from '../../../sidekick-test.js';

/**
 * The AEMSidekick object type
 * @typedef {import('../../../../src/extension/app/aem-sidekick.js').AEMSidekick} AEMSidekick
 */

// @ts-ignore
window.chrome = chromeMock;

describe('Toasts', () => {
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

  let toastSpy;

  beforeEach(async () => {
    appStore = new AppStore();
    sidekickTest = new SidekickTest(defaultSidekickConfig, appStore);
    sidekickTest
      .mockFetchStatusSuccess()
      .mockFetchSidekickConfigSuccess(true, false)
      .mockHelixEnvironment(HelixMockEnvironments.PREVIEW);

    toastSpy = sidekickTest.sandbox.spy(appStore, 'showToast');
  });

  afterEach(() => {
    sidekickTest.destroy();
  });

  it('renders wait modal and closes', async () => {
    sidekick = sidekickTest.createSidekick();

    await sidekickTest.awaitEnvSwitcher();

    appStore.showToast('Test Toast', 'info');

    await sidekickTest.awaitToast();
    expect(toastSpy.calledWith('Test Toast', 'info')).to.be.true;
    await waitUntil(() => recursiveQuery(sidekick, '.toast-container .message span').textContent === 'Test Toast');
    await sidekickTest.clickToastClose();
  }).timeout(5000);

  it('defaults to info icon', async () => {
    sidekick = sidekickTest.createSidekick();

    await sidekickTest.awaitEnvSwitcher();

    appStore.showToast('Test Toast');

    await sidekickTest.awaitToast();
  }).timeout(5000);

  it('renders 1 toast at a time', async () => {
    sidekick = sidekickTest.createSidekick();

    await sidekickTest.awaitEnvSwitcher();

    appStore.showToast('Test Toast 1', 'info');
    await sidekickTest.awaitToast();

    appStore.showToast('Test Toast 2', 'info');
    await sidekickTest.awaitToast();

    await waitUntil(() => recursiveQuery(sidekick, '.toast-container .message span').textContent === 'Test Toast 2');
    const toasts = [...recursiveQueryAll(sidekick, '.toast-container')];
    expect(toasts.length).to.equal(1);
  }).timeout(5000);
});
