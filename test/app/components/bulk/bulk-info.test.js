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
import { mockSharePointFile } from '../../../fixtures/content-sources.js';

// @ts-ignore
window.chrome = chromeMock;

describe('Test Bulk Info (gdrive)', () => {
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
    sidekickTest.mockAdminDOM(HelixMockContentSources.GDRIVE);
    await sidekickTest.awaitStatusFetched();
  });

  afterEach(() => {
    sidekickTest.destroy();
  });

  it('displays empty bulk selection message', async () => {
    const bulkInfo = recursiveQuery(sidekick, 'bulk-info');
    expect(bulkInfo).to.exist;
    await waitUntil(() => recursiveQuery(bulkInfo, 'span').textContent.trim() === 'Select files');
  }).timeout(5000);

  it('displays number of files in bulk selection', async () => {
    const bulkInfo = recursiveQuery(sidekick, 'bulk-info');

    sidekickTest.toggleAdminItems(['document']);
    await waitUntil(() => recursiveQuery(bulkInfo, 'span').textContent.trim() === '1 file selected');

    sidekickTest.toggleAdminItems(['spreadsheet']);
    await waitUntil(() => recursiveQuery(bulkInfo, 'span').textContent.trim() === '2 files selected');
  }).timeout(5000);
});

describe('Test Bulk Info (sharepoint)', () => {
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
    sidekickTest.mockAdminDOM(HelixMockContentSources.SHAREPOINT);
    await sidekickTest.awaitStatusFetched();
  });

  afterEach(() => {
    sidekickTest.destroy();
  });

  it('displays empty bulk selection message', async () => {
    const bulkInfo = recursiveQuery(sidekick, 'bulk-info');
    expect(bulkInfo).to.exist;
    await waitUntil(() => recursiveQuery(bulkInfo, 'span').textContent.trim() === 'Select files');
  }).timeout(5000);

  it('displays number of files in bulk selection', async () => {
    const bulkInfo = recursiveQuery(sidekick, 'bulk-info');

    await sidekickTest.toggleAdminItems(['document']);
    await waitUntil(() => recursiveQuery(bulkInfo, 'span').textContent.trim() === '1 file selected');

    await sidekickTest.toggleAdminItems(['spreadsheet.xlsx']);
    await waitUntil(() => recursiveQuery(bulkInfo, 'span').textContent.trim() === '2 files selected');
  }).timeout(5000);

  it('displays number of files selected in non-latin sharepoint', async () => {
    sidekickTest.bulkRoot.querySelector('#appRoot .file')
      .insertAdjacentHTML('beforebegin', mockSharePointFile({
        path: '/foo/non-latin',
        file: 'non-latin.docx',
        type: 'docx',
      }, 'list'));

    const bulkInfo = recursiveQuery(sidekick, 'bulk-info');
    await sidekickTest.toggleAdminItems(['non-latin']);

    await waitUntil(() => recursiveQuery(bulkInfo, 'span').textContent.trim() === '1 file selected');
  }).timeout(5000);
});
