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
import { expect, waitUntil } from '@open-wc/testing';
import { AppStore } from '../../../../src/extension/app/store/app.js';
import { SidekickTest } from '../../../sidekick-test.js';
import { defaultSidekickConfig } from '../../../fixtures/sidekick-config.js';
import { HelixMockContentSources } from '../../../mocks/environment.js';
import { recursiveQuery } from '../../../test-utils.js';
import chromeMock from '../../../mocks/chrome.js';

// @ts-ignore
window.chrome = chromeMock;

describe('Test Bulk Info', () => {
  let appStore;
  let sidekick;
  let sidekickTest;

  beforeEach(async () => {
    appStore = new AppStore();
    sidekickTest = new SidekickTest(defaultSidekickConfig, appStore);
    sidekickTest
      .mockFetchDirectoryStatusSuccess()
      .mockFetchSidekickConfigSuccess(true, false);
    sidekick = sidekickTest.createSidekick();
  });

  afterEach(() => {
    sidekickTest.destroy();
  });

  it('displays empty bulk selection message', async () => {
    sidekickTest.mockAdminDOM(HelixMockContentSources.GDRIVE);
    await sidekickTest.awaitStatusFetched();
    const bulkInfo = recursiveQuery(sidekick, 'bulk-info');
    expect(bulkInfo).to.exist;
    await waitUntil(() => recursiveQuery(bulkInfo, 'span').textContent.trim() === 'Select files');
  }).timeout(5000);

  it('displays number of files in bulk selection', async () => {
    sidekickTest.mockAdminDOM(HelixMockContentSources.GDRIVE);

    await sidekickTest.awaitStatusFetched();

    const bulkInfo = recursiveQuery(sidekick, 'bulk-info');

    sidekickTest.toggleAdminItems(['document']);
    await waitUntil(() => recursiveQuery(bulkInfo, 'span').textContent.trim() === '1 file selected');

    sidekickTest.toggleAdminItems(['spreadsheet']);
    await waitUntil(() => recursiveQuery(bulkInfo, 'span').textContent.trim() === '2 files selected');
  }).timeout(5000);
});
