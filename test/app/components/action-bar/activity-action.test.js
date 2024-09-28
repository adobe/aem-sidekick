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
import { STATE } from '../../../../src/extension/app/constants.js';
import { defaultCodeStatusResponse } from '../../../fixtures/helix-admin.js';

/**
 * The AEMSidekick object type
 * @typedef {import('../../../../src/extension/app/aem-sidekick.js').AEMSidekick} AEMSidekick
 */

// @ts-ignore
window.chrome = chromeMock;

describe('Activity', () => {
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

  describe('State', () => {
    it('renders spinner and text', async () => {
      sidekick = sidekickTest.createSidekick();

      await sidekickTest.awaitEnvSwitcher();
      appStore.setState(STATE.FETCHING_STATUS);

      await waitUntil(() => recursiveQuery(sidekick, 'activity-action'));
      const activityAction = recursiveQuery(sidekick, 'activity-action');
      await waitUntil(() => recursiveQuery(activityAction, 'sk-progress-circle[indeterminate]'));
      await waitUntil(() => recursiveQuery(activityAction, 'span')
        .textContent.trim() === 'Loading status...');
    }).timeout(5000);

    it('renders bulk progress', async () => {
      sidekick = sidekickTest.createSidekick();

      await sidekickTest.awaitEnvSwitcher();

      appStore.bulkStore.progress = {
        total: 20,
        processed: 1,
        failed: 0,
      };
      appStore.setState(STATE.BULK_PREVIEWING);

      await waitUntil(() => recursiveQuery(sidekick, 'activity-action'));
      const activityAction = recursiveQuery(sidekick, 'activity-action');
      await waitUntil(() => recursiveQuery(activityAction, 'sk-progress-circle'));
      await waitUntil(() => recursiveQuery(activityAction, 'span')
        .textContent.trim() === 'Preview for 1 of 20 files generated...');

      // show generic message if no progress
      appStore.bulkStore.progress = null;
      await waitUntil(() => recursiveQuery(activityAction, 'span')
        .textContent.trim() === 'Updating Preview...');
    }).timeout(5000);

    it('renders code state', async () => {
      sidekickTest.mockFetchStatusSuccess(false, defaultCodeStatusResponse);
      sidekick = sidekickTest.createSidekick();

      await waitUntil(() => recursiveQuery(sidekick, 'activity-action'));
      const activityAction = recursiveQuery(sidekick, 'activity-action');
      expect(recursiveQuery(activityAction, 'span').textContent.trim())
        .to.equal('No actions available for code files');
    });

    it('renders media state', async () => {
      sidekickTest.mockFetchStatusSuccess(false, {
        webPath: '/media_1234567890.png',
        code: { status: 404 },
        preview: { status: 404 },
        live: { status: 404 },
      });
      sidekick = sidekickTest.createSidekick();

      await waitUntil(() => recursiveQuery(sidekick, 'activity-action'));
      const activityAction = recursiveQuery(sidekick, 'activity-action');
      expect(recursiveQuery(activityAction, 'span').textContent.trim())
        .to.equal('No actions available for media files');
    });
  });

  describe('Toasts', () => {
    it('renders and closes a toast', async () => {
      const closeToastStub = sidekickTest.sandbox.stub(appStore, 'closeToast');
      sidekick = sidekickTest.createSidekick();

      await sidekickTest.awaitEnvSwitcher();

      appStore.showToast({
        message: 'Test Toast',
        variant: 'info',
      });

      await sidekickTest.awaitToast();
      expect(toastSpy.calledWith({
        message: 'Test Toast',
        variant: 'info',
      })).to.be.true;
      await waitUntil(() => recursiveQuery(sidekick, '.toast-container .message span')
        .textContent === 'Test Toast');

      await sidekickTest.clickToastClose();
      expect(closeToastStub.called).to.be.true;
    }).timeout(5000);

    it('renders a toast with primary action', async () => {
      const openPageStub = sidekickTest.sandbox.stub(appStore, 'openPage');
      sidekick = sidekickTest.createSidekick();

      await sidekickTest.awaitEnvSwitcher();

      appStore.showToast({
        message: 'Test Toast',
        variant: 'positive',
        actionCallback: () => appStore.openPage('https://www.aem.live/'),
        actionLabel: 'Action',
      });

      await sidekickTest.awaitToast();

      const actionButton = recursiveQuery(sidekick, '.toast-container .actions sk-action-button');
      actionButton.click();
      expect(openPageStub.calledWith('https://www.aem.live/')).to.be.true;

      await sidekickTest.clickToastClose();
    }).timeout(5000);

    it('renders a toast with a secondary action', async () => {
      const openPageStub = sidekickTest.sandbox.stub(appStore, 'openPage');
      sidekick = sidekickTest.createSidekick();

      await sidekickTest.awaitEnvSwitcher();

      appStore.showToast({
        message: 'Test Toast',
        variant: 'info',
        actionCallback: () => appStore.openPage('https://www.aem.live/'),
        actionLabel: 'Action 1',
        secondaryCallback: () => appStore.openPage('https://www.aem.live/docs/'),
        secondaryLabel: 'Action 2',
      });

      await sidekickTest.awaitToast();

      recursiveQueryAll(sidekick, '.toast-container .actions sk-action-button')
        .forEach((button) => button.click());
      expect(openPageStub.calledWith('https://www.aem.live/')).to.be.true;
      expect(openPageStub.calledWith('https://www.aem.live/docs/')).to.be.true;
    }).timeout(5000);

    it('renders 1 toast at a time', async () => {
      sidekick = sidekickTest.createSidekick();

      await sidekickTest.awaitEnvSwitcher();

      appStore.showToast({ message: 'Test Toast 1', variant: 'info' });
      await sidekickTest.awaitToast();

      appStore.showToast({ message: 'Test Toast 2', variant: 'info' });
      await sidekickTest.awaitToast();

      await waitUntil(() => recursiveQuery(sidekick, '.toast-container .message span')
        .textContent === 'Test Toast 2');
      const toasts = [...recursiveQueryAll(sidekick, '.toast-container')];
      expect(toasts.length).to.equal(1);
    }).timeout(5000);
  });
});
