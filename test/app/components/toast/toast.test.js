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
  expect, waitUntil, aTimeout,
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

/**
 * @typedef {import('../../../../src/extension/app/components/toast/toast-container.js').ToastContainer} ToastContainer
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

  beforeEach(async () => {
    appStore = new AppStore();
    sidekickTest = new SidekickTest(defaultSidekickConfig, appStore);
    sidekickTest
      .mockFetchStatusSuccess()
      .mockFetchSidekickConfigSuccess(true, false)
      .mockHelixEnvironment(HelixMockEnvironments.PREVIEW);
  });

  afterEach(() => {
    sidekickTest.destroy();
  });

  it('renders wait modal and closes', async () => {
    sidekick = sidekickTest.createSidekick();

    await sidekickTest.awaitEnvSwitcher();

    appStore.showToast('Test Toast', 'info');

    const toastContainer = recursiveQuery(sidekick, 'toast-container');

    await waitUntil(() => recursiveQuery(toastContainer, 'sp-toast'));

    const toast = recursiveQuery(toastContainer, 'sp-toast');
    expect(toast).to.exist;
    expect(toast.textContent).to.equal('Test Toast');
    expect(toast.getAttribute('variant')).to.equal('info');

    const closeButton = recursiveQuery(toast, 'sp-close-button');
    expect(closeButton).to.exist;
    closeButton.click();

    await aTimeout(1);
    expect(recursiveQuery(toastContainer, 'sp-toast')).to.be.undefined;
  });

  it('renders 1 toast at a time', async () => {
    sidekick = sidekickTest.createSidekick();

    await sidekickTest.awaitEnvSwitcher();

    appStore.showToast('Test Toast 1', 'info');

    appStore.showToast('Test Toast 2', 'info');

    const toastContainer = recursiveQuery(sidekick, 'toast-container');

    await waitUntil(() => recursiveQuery(toastContainer, 'sp-toast'));

    const toasts = [...recursiveQueryAll(toastContainer, 'sp-toast')];
    expect(toasts.length).to.equal(1);
  });
});
