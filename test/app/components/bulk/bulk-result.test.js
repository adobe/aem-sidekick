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
import chromeMock from '../../../mocks/chrome.js';
import { MODALS } from '../../../../src/extension/app/constants.js';
import { recursiveQuery } from '../../../test-utils.js';
import { BulkResult } from '../../../../src/extension/app/components/bulk/bulk-result/bulk-result.js';

// @ts-ignore
window.chrome = chromeMock;

describe('Test Bulk Result', () => {
  let appStore;
  let sidekickTest;

  beforeEach(async () => {
    appStore = new AppStore();
    sidekickTest = new SidekickTest(defaultSidekickConfig, appStore);
    sidekickTest
      .mockFetchStatusSuccess()
      .mockFetchSidekickConfigSuccess(true, false)
      .awaitStatusFetched();
    sidekickTest.createSidekick();
  });

  afterEach(() => {
    sidekickTest.destroy();
  });

  it('renders empty without bulk summary', async () => {
    const bullkResult = document.body.appendChild(new BulkResult());
    expect(bullkResult.shadowRoot.innerHTML).to.be.empty;
  }).timeout(5000);

  it('displays result from bulk summary', async () => {
    await sidekickTest.awaitEnvSwitcher();

    appStore.bulkStore.summary = {
      operation: 'preview',
      host: 'custom-preview-host.com',
      resources: [
        { path: '/file1', status: 200 },
        { path: '/file2', status: 415, error: 'unsupported media type' },
        { path: '/file3', status: 200 },
      ],
    };

    const modal = appStore.showModal({
      type: MODALS.BULK,
    });
    await waitUntil(() => recursiveQuery(modal, 'sp-dialog-wrapper'));
    const bulkResult = recursiveQuery(modal, 'bulk-result');
    expect(bulkResult).to.exist;
    const rows = bulkResult.shadowRoot.querySelectorAll('.row');
    expect(rows.length).to.equal(4);
    expect(rows[0].classList.contains('header')).to.be.true;
    expect(rows[1].querySelector('.status.success')).to.exist;
    expect(rows[1].querySelector('.path a').href).to.equal(`https://${appStore.siteStore.innerHost}/file1`);
    expect(rows[2].querySelector('.status.error')).to.exist;
    expect(rows[2].querySelector('.path + .error')).to.exist;
    expect(rows[3].querySelector('.status.success')).to.exist;
    expect(rows[3].querySelector('.path a').href).to.equal(`https://${appStore.siteStore.innerHost}/file3`);
  }).timeout(5000);
});
