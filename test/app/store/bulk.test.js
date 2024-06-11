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
import { aTimeout, expect, waitUntil } from '@open-wc/testing';
import { AppStore } from '../../../src/extension/app/store/app.js';
import { BulkStore } from '../../../src/extension/app/store/bulk.js';
import { SidekickTest } from '../../sidekick-test.js';
import { defaultSidekickConfig } from '../../fixtures/sidekick-config.js';
import {
  EditorMockEnvironments,
  HelixMockContentSources,
  getDefaultEditorEnviromentLocations,
} from '../../mocks/environment.js';
import chromeMock from '../../mocks/chrome.js';
import { recursiveQuery } from '../../test-utils.js';

// @ts-ignore
window.chrome = chromeMock;

function getLocation(adminEnv) {
  return new URL(
    getDefaultEditorEnviromentLocations(
      adminEnv,
      EditorMockEnvironments.ADMIN,
    ),
  );
}

async function confirmDialog(sidekick) {
  await waitUntil(() => recursiveQuery(sidekick, 'sp-dialog-wrapper'));
  const dialogWrapper = recursiveQuery(sidekick, 'sp-dialog-wrapper');
  const confirmButton = recursiveQuery(dialogWrapper, 'sp-button[variant="accent"]');
  confirmButton.click();
}

describe('Test Bulk Store', () => {
  let appStore;
  let bulkStore;
  let sidekickTest;

  beforeEach(async () => {
    appStore = new AppStore();
    sidekickTest = new SidekickTest(defaultSidekickConfig, appStore);
    sidekickTest
      .mockFetchDirectoryStatusSuccess()
      .mockFetchSidekickConfigSuccess(true, false);
  });

  afterEach(() => {
    sidekickTest.destroy();
  });

  [
    HelixMockContentSources.SHAREPOINT,
    HelixMockContentSources.GDRIVE,
  ].forEach((adminEnv) => {
    describe(adminEnv, () => {
      beforeEach(async () => {
        sidekickTest.mockAdminEnvironment(adminEnv);
        appStore.location = getLocation(adminEnv);
        bulkStore = new BulkStore(appStore);
      });

      describe('selection', () => {
        it('has empty selection when initialized', async () => {
          bulkStore.initStore(appStore.location);
          expect(bulkStore.selection.length).to.equal(0);
        });

        it('uses existing selection when initialized', async () => {
          sidekickTest.toggleAdminFiles(['document']);
          bulkStore.initStore(appStore.location);
          expect(bulkStore.selection.length).to.equal(1);
        });

        it('updates initial selection when user toggles files', async () => {
          bulkStore.initStore(appStore.location);
          expect(bulkStore.selection.length).to.equal(0);

          sidekickTest.toggleAdminFiles(['document']);
          await aTimeout(100);
          expect(bulkStore.selection.length).to.equal(1);
        });
      });

      describe('operations', () => {
        beforeEach(async () => {
          appStore.sidekick = sidekickTest.createSidekick();
          bulkStore.initStore(appStore.location);
        });

        describe('preview', () => {
          it('bulk preview starts job', async () => {
            const startJobStub = sidekickTest.sandbox.stub(appStore.api, 'startJob');
            sidekickTest.toggleAdminFiles(['document', 'spreadsheet']);
            await waitUntil(() => bulkStore.selection.length === 2);

            await bulkStore.preview();
            await confirmDialog(sidekickTest.sidekick);

            await waitUntil(() => startJobStub.called);
            expect(startJobStub.calledWith('preview', ['/document', '/spreadsheet.json'])).to.be.true;
          });

          it('1 file does not start job', async () => {
            const updateStub = sidekickTest.sandbox.stub(appStore, 'update');
            const startJobStub = sidekickTest.sandbox.stub(appStore.api, 'startJob');

            sidekickTest.toggleAdminFiles(['document']);
            await waitUntil(() => bulkStore.selection.length === 1);

            await bulkStore.preview();
            await confirmDialog(sidekickTest.sidekick);

            await waitUntil(() => updateStub.called);
            expect(updateStub.calledWith('/document')).to.be.true;
            expect(startJobStub.called).to.be.false;
          });
        });

        describe('publish', () => {
          it('bulk publish starts job', async () => {
            const startJobStub = sidekickTest.sandbox.stub(appStore.api, 'startJob');

            sidekickTest.toggleAdminFiles(['document', 'spreadsheet']);
            await waitUntil(() => bulkStore.selection.length === 2);

            await bulkStore.publish();
            await confirmDialog(sidekickTest.sidekick);

            await waitUntil(() => startJobStub.called);
            expect(startJobStub.calledWith('live', ['/document', '/spreadsheet.json'])).to.be.true;
          });

          it('1 file does not start job', async () => {
            const publishStub = sidekickTest.sandbox.stub(appStore, 'publish');
            const startJobStub = sidekickTest.sandbox.stub(appStore.api, 'startJob');

            sidekickTest.toggleAdminFiles(['document']);
            await waitUntil(() => bulkStore.selection.length === 1);

            await bulkStore.publish();
            await confirmDialog(sidekickTest.sidekick);

            await waitUntil(() => publishStub.called);
            expect(publishStub.calledWith('/document')).to.be.true;
            expect(startJobStub.called).to.be.false;
          });
        });
      });
    });
  });
});
