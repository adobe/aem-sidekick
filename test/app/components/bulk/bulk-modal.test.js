/*
 * Copyright 2024 Adobe. All rights reserved.
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
import { MODALS } from '../../../../src/extension/app/constants.js';
import chromeMock from '../../../mocks/chrome.js';
import { AppStore } from '../../../../src/extension/app/store/app.js';
import { recursiveQuery } from '../../../test-utils.js';
import { defaultSidekickConfig } from '../../../fixtures/sidekick-config.js';
import { HelixMockEnvironments } from '../../../mocks/environment.js';
import { SidekickTest } from '../../../sidekick-test.js';

// @ts-ignore
window.chrome = chromeMock;

/**
 * The AEMSidekick object type
 * @typedef {import('../../../../src/extension/app/aem-sidekick.js').AEMSidekick} AEMSidekick
 */

describe('Modals', () => {
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

  describe('bulk modal', () => {
    beforeEach(async () => {
      sidekick = sidekickTest.createSidekick();
      await sidekickTest.awaitEnvSwitcher();
    });

    it('does not render without bulk operation summary', async () => {
      appStore.showModal({
        type: MODALS.BULK,
      });
      await aTimeout(100);

      expect(recursiveQuery(sidekick, 'modal-container')).to.be.undefined;
    });

    it('displays bulk operation summary for multiple files', async () => {
      appStore.bulkStore.summary = {
        operation: 'preview',
        host: appStore.siteStore.innerHost,
        resources: [
          { path: '/foo/1', status: 200 },
          { path: '/foo/2', status: 200 },
          { path: '/foo/3', status: 200 },
        ],
      };
      appStore.showModal({
        type: MODALS.BULK,
      });

      const modal = recursiveQuery(sidekick, 'modal-container');
      await waitUntil(() => recursiveQuery(modal, 'sp-dialog-wrapper'));

      const dialogWrapper = recursiveQuery(modal, 'sp-dialog-wrapper');
      expect(dialogWrapper.getAttribute('open')).to.equal('');

      // check headline
      const dialogHeading = recursiveQuery(dialogWrapper, 'h2');
      expect(dialogHeading.textContent.trim()).to.eq('Preview of 3 files successfully generated.');
      expect(recursiveQuery(dialogWrapper, 'bulk-result')).to.exist;

      // check buttons
      const closeButton = recursiveQuery(dialogWrapper, 'sp-button[variant="secondary"]');
      expect(closeButton.textContent.trim()).to.equal('Close');
      const copyButton = recursiveQuery(dialogWrapper, 'sp-button[variant="primary"]');
      expect(copyButton.textContent.trim()).to.equal('Copy 3 URLs');
      const openButton = recursiveQuery(dialogWrapper, 'sp-button[variant="accent"]');
      expect(openButton.textContent.trim()).to.equal('Open 3 URLs');
    });

    it('displays bulk operation summary for single file', async () => {
      appStore.bulkStore.summary = {
        operation: 'preview',
        host: appStore.siteStore.innerHost,
        resources: [
          { path: '/foo/1', status: 200 },
        ],
      };
      appStore.showModal({
        type: MODALS.BULK,
      });

      const modal = recursiveQuery(sidekick, 'modal-container');
      await waitUntil(() => recursiveQuery(modal, 'sp-dialog-wrapper'));

      const dialogWrapper = recursiveQuery(modal, 'sp-dialog-wrapper');
      expect(dialogWrapper.getAttribute('open')).to.equal('');

      // check headline
      const dialogHeading = recursiveQuery(dialogWrapper, 'h2');
      expect(dialogHeading.textContent.trim()).to.eq('Preview of this file successfully generated.');
      expect(recursiveQuery(dialogWrapper, 'bulk-result')).to.exist;

      // check buttons
      const copyButton = recursiveQuery(dialogWrapper, 'sp-button[variant="primary"]');
      expect(copyButton.textContent.trim()).to.equal('Copy URL');
      const openButton = recursiveQuery(dialogWrapper, 'sp-button[variant="accent"]');
      expect(openButton.textContent.trim()).to.equal('Open URL');
    });

    it('displays bulk operation summary for partial success', async () => {
      appStore.bulkStore.summary = {
        operation: 'preview',
        host: appStore.siteStore.innerHost,
        resources: [
          { path: '/foo/1', status: 200 },
          { path: '/foo/2', status: 404 },
        ],
      };
      appStore.showModal({
        type: MODALS.BULK,
      });

      const modal = recursiveQuery(sidekick, 'modal-container');
      await waitUntil(() => recursiveQuery(modal, 'sp-dialog-wrapper'));

      const dialogWrapper = recursiveQuery(modal, 'sp-dialog-wrapper');
      expect(dialogWrapper.getAttribute('open')).to.equal('');

      // check headline
      const dialogHeading = recursiveQuery(dialogWrapper, 'h2');
      expect(dialogHeading.textContent.trim()).to.eq('1 file successfully generated, but 1 failed.');
      expect(recursiveQuery(dialogWrapper, 'bulk-result')).to.exist;

      // check buttons
      const copyButton = recursiveQuery(dialogWrapper, 'sp-button[variant="primary"]');
      expect(copyButton.textContent.trim()).to.equal('Copy URL');
      const openButton = recursiveQuery(dialogWrapper, 'sp-button[variant="accent"]');
      expect(openButton.textContent.trim()).to.equal('Open URL');
    });

    it('displays bulk operation summary for failure', async () => {
      appStore.bulkStore.summary = {
        operation: 'preview',
        host: appStore.siteStore.innerHost,
        resources: [
          { path: '/foo/1', status: 415 },
          { path: '/foo/2', status: 413 },
        ],
      };
      appStore.showModal({
        type: MODALS.BULK,
      });

      const modal = recursiveQuery(sidekick, 'modal-container');
      await waitUntil(() => recursiveQuery(modal, 'sp-dialog-wrapper'));

      const dialogWrapper = recursiveQuery(modal, 'sp-dialog-wrapper');
      expect(dialogWrapper.getAttribute('open')).to.equal('');

      // check headline
      const dialogHeading = recursiveQuery(dialogWrapper, 'h2');
      expect(dialogHeading.textContent.trim()).to.eq('Failed to generate preview of all files.');
      expect(recursiveQuery(dialogWrapper, 'bulk-result')).to.exist;

      // check buttons
      expect(recursiveQuery(dialogWrapper, 'sp-button[variant="secondary"]')).to.exist;
      expect(recursiveQuery(dialogWrapper, 'sp-button[variant="primary"]')).to.not.exist;
      expect(recursiveQuery(dialogWrapper, 'sp-button[variant="accent"]')).to.not.exist;
    });

    it('closes modal', async () => {
      appStore.bulkStore.summary = {
        operation: 'preview',
        host: appStore.siteStore.innerHost,
        resources: [
          { path: '/foo/1', status: 200 },
          { path: '/foo/2', status: 200 },
          { path: '/foo/3', status: 200 },
        ],
      };
      appStore.showModal({
        type: MODALS.BULK,
      });

      const modal = recursiveQuery(sidekick, 'modal-container');
      await waitUntil(() => recursiveQuery(modal, 'sp-dialog-wrapper'));

      const dialogWrapper = recursiveQuery(modal, 'sp-dialog-wrapper');
      const closeButton = recursiveQuery(dialogWrapper, 'sp-button[variant="secondary"]');
      closeButton.click();

      await aTimeout(100);

      expect(recursiveQuery(sidekick, 'modal-container')).to.be.undefined;
    });

    it('copys urls', async () => {
      const copyUrlsStub = sidekickTest.sandbox.stub(appStore.bulkStore, 'copyUrls');
      appStore.bulkStore.summary = {
        operation: 'preview',
        host: appStore.siteStore.innerHost,
        resources: [
          { path: '/foo/1', status: 200 },
          { path: '/foo/2', status: 200 },
          { path: '/foo/3', status: 200 },
        ],
      };
      appStore.showModal({
        type: MODALS.BULK,
      });

      const modal = recursiveQuery(sidekick, 'modal-container');
      await waitUntil(() => recursiveQuery(modal, 'sp-dialog-wrapper'));

      const dialogWrapper = recursiveQuery(modal, 'sp-dialog-wrapper');
      const copyButton = recursiveQuery(dialogWrapper, 'sp-button[variant="primary"]');
      copyButton.click();

      await aTimeout(100);

      expect(copyUrlsStub.calledOnce).to.be.true;
      expect(recursiveQuery(sidekick, 'modal-container')).to.be.undefined;
    });

    it('open urls', async () => {
      const openUrlsStub = sidekickTest.sandbox.stub(appStore.bulkStore, 'openUrls');
      appStore.bulkStore.summary = {
        operation: 'preview',
        host: appStore.siteStore.innerHost,
        resources: [
          { path: '/foo/1', status: 200 },
          { path: '/foo/2', status: 200 },
          { path: '/foo/3', status: 200 },
        ],
      };
      appStore.showModal({
        type: MODALS.BULK,
      });

      const modal = recursiveQuery(sidekick, 'modal-container');
      await waitUntil(() => recursiveQuery(modal, 'sp-dialog-wrapper'));

      const dialogWrapper = recursiveQuery(modal, 'sp-dialog-wrapper');
      const openButton = recursiveQuery(dialogWrapper, 'sp-button[variant="accent"]');
      openButton.click();

      await aTimeout(100);

      expect(openUrlsStub.calledOnce).to.be.true;
      expect(recursiveQuery(sidekick, 'modal-container')).to.be.undefined;
    });
  });
});
