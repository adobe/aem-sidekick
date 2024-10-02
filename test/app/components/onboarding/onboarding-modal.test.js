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
import { expect, waitUntil } from '@open-wc/testing';
import { recursiveQuery, recursiveQueryAll } from '../../../test-utils.js';
import chromeMock from '../../../mocks/chrome.js';
import { defaultSidekickConfig } from '../../../fixtures/sidekick-config.js';
import '../../../../src/extension/index.js';
import { AppStore } from '../../../../src/extension/app/store/app.js';
import { SidekickTest } from '../../../sidekick-test.js';
import { HelixMockEnvironments } from '../../../mocks/environment.js';

/**
 * The AEMSidekick object type
 * @typedef {import('../../../../src/extension/app/aem-sidekick.js').AEMSidekick} AEMSidekick
 */

// @ts-ignore
window.chrome = chromeMock;

describe('Onboarding modal', () => {
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
      .mockFetchOnboardingSuccess()
      .mockFetchStatusSuccess()
      .mockFetchSidekickConfigSuccess(true, true)
      .mockHelixEnvironment(HelixMockEnvironments.PREVIEW);

    sidekickTest.localStorageStub.resolves({ onboarded: false });
  });

  afterEach(() => {
    sidekickTest.destroy();
  });

  it('click next and close', async () => {
    sidekick = sidekickTest.createSidekick();
    await sidekickTest.awaitEnvSwitcher();

    const themeWrapper = sidekick.shadowRoot.querySelector('theme-wrapper');
    await waitUntil(() => recursiveQuery(themeWrapper, 'onboarding-dialog'));
    const onboardingDialog = recursiveQuery(themeWrapper, 'onboarding-dialog');
    await waitUntil(() => recursiveQuery(onboardingDialog, 'sp-button#next'));
    const nextButton = recursiveQuery(onboardingDialog, 'sp-button#next');

    const environmentsTab = recursiveQuery(onboardingDialog, 'sp-tab[label="Switch environments"]');
    nextButton.click();
    await waitUntil(() => environmentsTab.hasAttribute('selected'));
    expect(Array.from(recursiveQueryAll(onboardingDialog, 'sp-tab')).length).to.equal(5);

    const closeButton = recursiveQuery(onboardingDialog, 'sp-button#close-button');
    closeButton.click();

    await waitUntil(() => recursiveQuery(themeWrapper, 'onboarding-dialog') === undefined);
  });

  it('should trigger import', async () => {
    sidekick = sidekickTest.createSidekick();
    await sidekickTest.awaitEnvSwitcher();

    const themeWrapper = sidekick.shadowRoot.querySelector('theme-wrapper');
    await waitUntil(() => recursiveQuery(themeWrapper, 'onboarding-dialog'));
    const onboardingDialog = recursiveQuery(themeWrapper, 'onboarding-dialog');
    await waitUntil(() => recursiveQuery(onboardingDialog, 'sp-button#next'));

    const importTab = recursiveQuery(onboardingDialog, 'sp-tab[label="Import your projects"]');
    importTab.click();
    await waitUntil(() => importTab.hasAttribute('selected'), 'Tab not selected');

    const messageStub = sidekickTest.sandbox.spy(chrome.runtime, 'sendMessage');
    const importButton = recursiveQuery(onboardingDialog, 'sp-button[variant="secondary"]');
    importButton.click();

    expect(messageStub).calledWith({ action: 'importProjects' });
    expect(sidekickTest.rumStub).calledWith('click', { source: 'sidekick', target: 'onboard-modal:import-projects' });
  });

  it('should open community', async () => {
    sidekick = sidekickTest.createSidekick();
    await sidekickTest.awaitEnvSwitcher();

    const themeWrapper = sidekick.shadowRoot.querySelector('theme-wrapper');
    await waitUntil(() => recursiveQuery(themeWrapper, 'onboarding-dialog'), 'Onboarding dialog not found', { timeout: 10000 });
    const onboardingDialog = recursiveQuery(themeWrapper, 'onboarding-dialog');
    await waitUntil(() => recursiveQuery(onboardingDialog, 'sp-button#next'), 'Next button not found', { timeout: 10000 });

    const importTab = recursiveQuery(onboardingDialog, 'sp-tab[label="Join our community"]');
    importTab.click();
    await waitUntil(() => importTab.hasAttribute('selected'));

    const messageStub = sidekickTest.sandbox.stub(sidekickTest.appStore, 'openPage');
    const importButton = recursiveQuery(onboardingDialog, 'sp-button[variant="secondary"]');
    importButton.click();

    expect(messageStub).calledWith('https://discord.gg/aem-live');
    expect(sidekickTest.rumStub).calledWith('click', { source: 'sidekick', target: 'open-discord' });
  });

  it('click next on last page closes onboarding', async () => {
    sidekick = sidekickTest.createSidekick();
    await sidekickTest.awaitEnvSwitcher();

    const themeWrapper = sidekick.shadowRoot.querySelector('theme-wrapper');
    await waitUntil(() => recursiveQuery(themeWrapper, 'onboarding-dialog'));
    const onboardingDialog = recursiveQuery(themeWrapper, 'onboarding-dialog');
    await waitUntil(() => recursiveQuery(onboardingDialog, 'sp-button#next'));

    const communityTab = recursiveQuery(onboardingDialog, 'sp-tab[label="Join our community"]');
    communityTab.click();
    await waitUntil(() => communityTab.hasAttribute('selected'));

    const doneButton = recursiveQuery(onboardingDialog, 'sp-button#next');
    doneButton.click();

    await waitUntil(() => recursiveQuery(themeWrapper, 'onboarding-dialog') === undefined);
  });

  it('click next on last page closes onboarding', async () => {
    sidekickTest.mockFetchOnboardingFailure();

    sidekick = sidekickTest.createSidekick();
    await sidekickTest.awaitEnvSwitcher();

    const themeWrapper = sidekick.shadowRoot.querySelector('theme-wrapper');
    expect(recursiveQuery(themeWrapper, 'onboarding-dialog')).to.not.exist;
  });
});
