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
import { SidekickTest } from '../../sidekick-test.js';
import { defaultSidekickConfig } from '../../fixtures/sidekick-config.js';
import {
  EditorMockEnvironments,
  HelixMockContentSources,
  getDefaultEditorEnviromentLocations,
} from '../../mocks/environment.js';
import chromeMock from '../../mocks/chrome.js';
import { recursiveQuery } from '../../test-utils.js';
import { MODAL_EVENTS } from '../../../src/extension/app/constants.js';

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
  dialogWrapper.dispatchEvent(new CustomEvent(MODAL_EVENTS.CONFIRM));
  await waitUntil(() => !recursiveQuery(sidekick, 'sp-dialog-wrapper'));
}

describe('Test Bulk Store', () => {
  let appStore;
  let bulkStore;
  let sidekickTest;

  beforeEach(() => {
    appStore = new AppStore();
    sidekickTest = new SidekickTest(defaultSidekickConfig, appStore);
    sidekickTest
      .mockFetchDirectoryStatusSuccess()
      .mockFetchSidekickConfigSuccess(true, false);
  });

  afterEach(() => {
    sidekickTest.destroy();
  });

  // Test both SharePoint and Google Drive
  [
    // HelixMockContentSources.SHAREPOINT,
    HelixMockContentSources.GDRIVE,
  ].forEach((adminEnv) => {
    beforeEach(async () => {
      sidekickTest.mockLocation(getLocation(adminEnv));
      await appStore.loadContext(sidekickTest.createSidekick(), defaultSidekickConfig);
      bulkStore = appStore.bulkStore;
    });

    // Test selection in both list and grid view
    ['list', 'grid'].forEach((viewType) => {
      describe(`selection in ${adminEnv} (${viewType})`, () => {
        beforeEach(() => {
          sidekickTest.mockAdminDOM(adminEnv, viewType);
        });

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
    });

    describe('validation', () => {
      beforeEach(() => {
        sidekickTest.mockAdminDOM(adminEnv);
      });

      it.skip('flags invalid file name', async () => {
        sidekickTest.toggleAdminFiles(['document']);
        const item = sidekickTest.bulkRoot.querySelector('.file[aria-selected="true"]');
        item.innerHTML = item.innerHTML.replaceAll('document', 'document?');

        bulkStore.initStore(appStore.location);
        expect(bulkStore.selection.length).to.equal(1);
        expect(bulkStore.selection[0].file).to.equal('!ILLEGAL!_document?');
      });
    });

    describe('operations', () => {
      let startJobStub;
      let updateStub;
      let publishStub;

      beforeEach(() => {
        sidekickTest.mockAdminDOM(adminEnv);
        appStore.sidekick = sidekickTest.createSidekick();

        startJobStub = sidekickTest.sandbox.stub(appStore.api, 'startJob');
        updateStub = sidekickTest.sandbox.stub(appStore, 'update');
        publishStub = sidekickTest.sandbox.stub(appStore, 'publish');
      });

      describe('preview', () => {
        it('bulk preview starts job', async () => {
          sidekickTest.toggleAdminFiles(['document', 'spreadsheet']);
          bulkStore.initStore(appStore.location);
          await waitUntil(() => bulkStore.selection.length === 2);

          await bulkStore.preview();
          await confirmDialog(sidekickTest.sidekick);

          await waitUntil(() => startJobStub.called);
          expect(startJobStub.calledWith('preview', ['/document', '/spreadsheet.json'])).to.be.true;
        });

        it('1 file does not start job', async () => {
          sidekickTest.toggleAdminFiles(['document']);
          bulkStore.initStore(appStore.location);
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
          sidekickTest.toggleAdminFiles(['document', 'spreadsheet']);
          bulkStore.initStore(appStore.location);
          await waitUntil(() => bulkStore.selection.length === 2);

          await bulkStore.publish();
          await confirmDialog(sidekickTest.sidekick);

          await waitUntil(() => startJobStub.called);
          expect(startJobStub.calledWith('live', ['/document', '/spreadsheet.json'])).to.be.true;
        });

        it('1 file does not start job', async () => {
          sidekickTest.toggleAdminFiles(['document']);
          bulkStore.initStore(appStore.location);
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
