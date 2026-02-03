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
/* eslint-disable no-unused-expressions, import/no-extraneous-dependencies */

import { expect, waitUntil } from '@open-wc/testing';
import { recursiveQuery } from '../../../test-utils.js';
import chromeMock from '../../../mocks/chrome.js';
import { defaultSidekickConfig } from '../../../fixtures/sidekick-config.js';
import '../../../../src/extension/index.js';
import { AppStore } from '../../../../src/extension/app/store/app.js';
import {
  EditorMockEnvironments,
} from '../../../mocks/environment.js';
import { SidekickTest } from '../../../sidekick-test.js';

/**
 * The AEMSidekick object type
 * @typedef {import('../../../../src/extension/app/aem-sidekick.js').AEMSidekick} AEMSidekick
 */

/**
 * The BulkStore object type
 * @typedef {import('../../../../src/extension/app/store/bulk.js').BulkStore} BulkStore
 */

// @ts-ignore
window.chrome = chromeMock;

describe('Bulk preview plugin', () => {
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

  /**
   * @type {BulkStore}
   */
  let bulkStore;

  let copyUrlsStub;

  beforeEach(async () => {
    appStore = new AppStore();
    bulkStore = appStore.bulkStore;
    sidekickTest = new SidekickTest(defaultSidekickConfig, appStore);
    sidekickTest
      .mockFetchSidekickConfigSuccess(false, false)
      .mockFetchDirectoryStatusSuccess()
      .mockLocation(EditorMockEnvironments.ADMIN)
      .mockAdminDOM();

    sidekick = sidekickTest.createSidekick();
    copyUrlsStub = sidekickTest.sandbox.stub(bulkStore, 'copyUrls');

    await sidekickTest.awaitStatusFetched();
  });

  afterEach(() => {
    sidekickTest.destroy();
  });

  it('bulk copy preview urls calls bulkStore.copyUrls() with preview host', async () => {
    sidekickTest.toggleAdminItems(['document', 'spreadsheet']);
    await waitUntil(() => bulkStore.selection.length === 2);

    const bulkPreviewPlugin = recursiveQuery(sidekick, '.bulk-copy-preview-urls');
    expect(bulkPreviewPlugin.textContent.trim()).to.equal('Copy Preview URLs');

    bulkPreviewPlugin.click();

    await waitUntil(() => copyUrlsStub.called);
    expect(copyUrlsStub.calledWith()).to.be.true;
  });

  it('bulk copy live urls calls bulkStore.copyUrls() with live host', async () => {
    sidekickTest.toggleAdminItems(['document', 'spreadsheet']);
    await waitUntil(() => bulkStore.selection.length === 2);

    const bulkLivePlugin = recursiveQuery(sidekick, '.bulk-copy-live-urls');
    expect(bulkLivePlugin.textContent.trim()).to.equal('Copy Live URLs');

    bulkLivePlugin.click();

    await waitUntil(() => copyUrlsStub.calledWith('main--aem-boilerplate--adobe.aem.live'));
  });

  it('bulk copy prod urls calls bulkStore.copyUrls() with prod host', async () => {
    // add prod host
    appStore.loadContext(sidekickTest.sidekick, {
      ...defaultSidekickConfig,
      host: 'www.example.com',
    });

    sidekickTest.toggleAdminItems(['document', 'spreadsheet']);
    await waitUntil(() => bulkStore.selection.length === 2);

    const bulkProdPlugin = recursiveQuery(sidekick, '.bulk-copy-prod-urls');
    expect(bulkProdPlugin.textContent.trim()).to.equal('Copy Production URLs');

    bulkProdPlugin.click();
    await waitUntil(() => copyUrlsStub.calledWith('www.example.com'));
  });
});
