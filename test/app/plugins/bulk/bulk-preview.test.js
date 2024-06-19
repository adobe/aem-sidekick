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

  let previewStub;

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
    previewStub = sidekickTest.sandbox.stub(bulkStore, 'preview');
  });

  afterEach(() => {
    sidekickTest.destroy();
  });

  it('bulk preview calls bulkStore.preview()', async () => {
    await sidekickTest.awaitStatusFetched();
    sidekickTest.toggleAdminItems(['document', 'spreadsheet']);
    await waitUntil(() => bulkStore.selection.length === 2);

    const bulkPreviewPlugin = recursiveQuery(sidekick, '.bulk-preview');
    expect(bulkPreviewPlugin.textContent.trim()).to.equal('Preview');

    bulkPreviewPlugin.click();

    await waitUntil(() => previewStub.calledOnce);
  });
});
