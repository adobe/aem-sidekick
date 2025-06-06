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
import fetchMock from 'fetch-mock/esm/client.js';
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
import { error, recursiveQuery, recursiveQueryAll } from '../../test-utils.js';
import { MODALS, MODAL_EVENTS, STATE } from '../../../src/extension/app/constants.js';
import { log } from '../../../src/extension/log.js';
import {
  DEFAULT_GDRIVE_BULK_SELECTION,
  DEFAULT_SHAREPOINT_BULK_SELECTION,
  mockSharePointFile,
} from '../../fixtures/content-sources.js';

// @ts-ignore
window.chrome = chromeMock;

function getAdminLocation(adminEnv) {
  return getDefaultEditorEnviromentLocations(
    adminEnv,
    EditorMockEnvironments.ADMIN,
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

  afterEach(async () => {
    sidekickTest.destroy();
  });

  // Test selection in different admin environments
  [
    HelixMockContentSources.GDRIVE,
    HelixMockContentSources.SHAREPOINT,
  ].forEach((adminEnv) => {
    describe(adminEnv, () => {
      beforeEach(async () => {
        appStore = new AppStore();
        bulkStore = appStore.bulkStore;
        sidekickTest = new SidekickTest(defaultSidekickConfig, appStore);
        sidekickTest
          .mockFetchStatusSuccess()
          .mockFetchDirectoryStatusSuccess()
          .mockFetchSidekickConfigSuccess(true, false)
          .mockLocation(getAdminLocation(adminEnv));
        await appStore.loadContext(sidekickTest.createSidekick(), sidekickTest.config);
      });

      describe(`selection in ${adminEnv} (list)`, () => {
        beforeEach(async () => {
          sidekickTest.mockAdminDOM(adminEnv, 'list');
        });

        it('has empty selection when initialized', async () => {
          bulkStore.initStore(appStore.location);
          expect(bulkStore.selection.length).to.equal(0);
        });

        it('uses existing selection when initialized', async () => {
          sidekickTest.toggleAdminItems(['document']);
          bulkStore.initStore(appStore.location);
          await waitUntil(() => bulkStore.selection.length === 1);
        });

        it('updates initial selection when user toggles files', async () => {
          bulkStore.initStore(appStore.location);
          expect(bulkStore.selection.length).to.equal(0);

          sidekickTest.toggleAdminItems(['document']);
          await waitUntil(() => bulkStore.selection.length === 1);
        });
      });

      const testFn = adminEnv === HelixMockContentSources.SHAREPOINT ? describe : describe.skip;
      testFn(`selection in ${adminEnv} (newer sharepoint admin view)`, () => {
        beforeEach(async () => {
          sidekickTest.mockAdminDOM(adminEnv, 'new-sharepoint-list');
        });

        it('has empty selection when initialized', async () => {
          bulkStore.initStore(appStore.location);
          expect(bulkStore.selection.length).to.equal(0);
        });

        it('uses existing selection when initialized', async () => {
          sidekickTest.toggleAdminItems(['document']);
          bulkStore.initStore(appStore.location);
          await waitUntil(() => bulkStore.selection.length === 1);
        });

        it('updates initial selection when user toggles files', async () => {
          bulkStore.initStore(appStore.location);
          expect(bulkStore.selection.length).to.equal(0);

          sidekickTest.toggleAdminItems(['document']);
          await waitUntil(() => bulkStore.selection.length === 1);
        });
      });

      describe(`selection in ${adminEnv} (grid)`, () => {
        beforeEach(async () => {
          sidekickTest.mockAdminDOM(adminEnv, 'grid');
        });

        it('has empty selection when initialized', async () => {
          bulkStore.initStore(appStore.location);
          expect(bulkStore.selection.length).to.equal(0);
        });

        it('uses existing selection when initialized', async () => {
          sidekickTest.toggleAdminItems(['document']);
          bulkStore.initStore(appStore.location);
          await waitUntil(() => bulkStore.selection.length === 1);
        });

        it('updates initial selection when user toggles files', async () => {
          bulkStore.initStore(appStore.location);
          expect(bulkStore.selection.length).to.equal(0);

          sidekickTest.toggleAdminItems(['document']);
          await waitUntil(() => bulkStore.selection.length === 1);
        });
      });

      describe(`validation in ${adminEnv}`, () => {
        const allItems = (adminEnv === HelixMockContentSources.SHAREPOINT
          ? DEFAULT_SHAREPOINT_BULK_SELECTION
          : DEFAULT_GDRIVE_BULK_SELECTION).map((item) => item.file);

        beforeEach(async () => {
          sidekickTest.mockAdminDOM(adminEnv);
          // select all files
          sidekickTest.toggleAdminItems(allItems);
        });

        it('selects files but not folders', async () => {
          bulkStore.initStore(appStore.location);
          expect(bulkStore.selection.length).to.equal(allItems.length - 1); // minus folder
        });

        it('detects all file types with one unknown', async () => {
          bulkStore.initStore(appStore.location);
          expect(bulkStore.selection.filter((item) => item.type === 'unknown').length).to.equal(1);
        });
      });

      describe('validation', () => {
        it('flags invalid file name', async () => {
          sidekickTest.mockAdminDOM(adminEnv, 'list', [
            { path: '/foo/image?.jpg', type: 'image' },
          ]);
          sidekickTest.toggleAdminItems(['image?.jpg']);
          bulkStore.initStore(appStore.location);
          expect(bulkStore.selection.length).to.equal(1);
          expect(bulkStore.selection[0].file).to.equal('!ILLEGAL!_image?.jpg');
        });
      });

      describe('selection to path conversion', () => {
        it('bulk previews selection and displays success toast', async () => {
          sidekickTest.mockAdminDOM(adminEnv, 'list');
          sidekickTest.mockFetchDirectoryStatusSuccess(adminEnv, {
            webPath: '/foo',
          });
          await appStore.fetchStatus();

          const startJobStub = sidekickTest.sandbox.stub(appStore.api, 'startJob').resolves(null);
          sidekickTest.toggleAdminItems([
            'document',
            'spreadsheet',
            'index',
          ]);
          bulkStore.initStore(appStore.location);
          await waitUntil(() => bulkStore.selection.length === 3);

          await bulkStore.preview();
          await confirmDialog(sidekickTest.sidekick);
          await waitUntil(() => startJobStub.called);

          const paths = startJobStub.args[0][1];
          expect(paths.length).to.equal(3);
          expect(paths.includes('/foo/document')).to.be.true;
          expect(paths.includes('/foo/spreadsheet.json')).to.be.true;
          expect(paths.includes('/foo/')).to.be.true;
        });
      });
    });
  });

  describe('operations', () => {
    let startJobStub;
    let getJobStub;
    let updateStub;
    let publishStub;
    let openPageStub;
    let writeTextStub;
    let fireEventStub;
    let showToastSpy;
    let showModalSpy;
    let setStateSpy;
    let openUrlsSpy;
    let copyUrlsSpy;

    beforeEach(async () => {
      appStore = new AppStore();
      bulkStore = appStore.bulkStore;
      sidekickTest = new SidekickTest(defaultSidekickConfig, appStore);
      sidekickTest
        .mockFetchStatusSuccess()
        .mockFetchDirectoryStatusSuccess()
        .mockFetchSidekickConfigSuccess(true, false)
        .mockLocation(getAdminLocation(HelixMockContentSources.SHAREPOINT))
        .mockAdminDOM();
      await appStore.loadContext(sidekickTest.createSidekick(), sidekickTest.config);

      startJobStub = sidekickTest.sandbox.stub(appStore.api, 'startJob');
      startJobStub.callsFake(async (api) => ({
        job: {
          topic: api === 'preview' ? 'preview' : 'publish',
          name: '123',
        },
      }));
      getJobStub = sidekickTest.sandbox.stub(appStore.api, 'getJob');
      getJobStub.callsFake(async (topic, name) => ({
        topic,
        name,
        state: 'running',
        progress: {
          total: bulkStore.selection.length,
          processed: 1,
          failed: 0,
        },
      }));
      updateStub = sidekickTest.sandbox.stub(appStore, 'update');
      publishStub = sidekickTest.sandbox.stub(appStore, 'publish');
      openPageStub = sidekickTest.sandbox.stub(appStore, 'openPage');
      fireEventStub = sidekickTest.sandbox.stub(appStore, 'fireEvent');
      writeTextStub = sidekickTest.sandbox.stub(navigator.clipboard, 'writeText');
      openUrlsSpy = sidekickTest.sandbox.spy(bulkStore, 'openUrls');
      copyUrlsSpy = sidekickTest.sandbox.spy(bulkStore, 'copyUrls');
      showToastSpy = sidekickTest.sandbox.spy(appStore, 'showToast');
      showModalSpy = sidekickTest.sandbox.spy(appStore, 'showModal');
      setStateSpy = sidekickTest.sandbox.spy(appStore, 'setState');

      // catch any stray job requests to admin api
      fetchMock.sticky(
        'glob:https://admin.hlx.page/job/*',
        { status: 200, body: {} },
        { overwriteRoutes: true },
      );
    });

    describe('preview', () => {
      it('handles emtpy selection', async () => {
        const debugStub = sidekickTest.sandbox.stub(log, 'debug');
        bulkStore.initStore(appStore.location);

        await bulkStore.preview();

        await waitUntil(() => debugStub.called);
      });

      it('rejects file name with illegal characters', async () => {
        // insert items with illegal file names
        sidekickTest.bulkRoot.querySelector('#appRoot .file')
          .insertAdjacentHTML('beforebegin', mockSharePointFile({
            path: '/foo/image?.jpg',
            file: 'image?.jpg',
            type: 'image',
          }));
        sidekickTest.bulkRoot.querySelector('#appRoot .file')
          .insertAdjacentHTML('beforebegin', mockSharePointFile({
            path: '/foo/video*.mp4',
            file: 'video*.mp4',
            type: 'video',
          }));

        // select illegal items
        sidekickTest.toggleAdminItems(['image?.jpg']);
        sidekickTest.toggleAdminItems(['video*.mp4']);
        await waitUntil(() => bulkStore.selection.length === 2);

        await bulkStore.preview();

        expect(startJobStub.called).to.be.false;
        expect(showToastSpy.calledWithMatch({
          variant: 'warning',
          timeout: 0,
        })).to.be.true;
        const { message } = showToastSpy.args[0][0];
        expect(message).to.include('/image?.jpg');
        expect(message).to.include('/video*.mp4');
      });

      it('rejects file name with only non-latin characters', async () => {
        // insert item with illegal file name
        sidekickTest.bulkRoot.querySelector('#appRoot .file')
          .insertAdjacentHTML('beforebegin', mockSharePointFile({
            path: '/foo/テスト.docx',
            file: 'テスト.docx',
            type: 'docx',
          }));

        sidekickTest.toggleAdminItems(['テスト']);
        await waitUntil(() => bulkStore.selection.length === 1);

        await bulkStore.preview();

        expect(startJobStub.called).to.be.false;
        expect(showToastSpy.calledWithMatch({
          variant: 'warning',
          timeout: 0,
        })).to.be.true;
        expect(showToastSpy.args[0][0].message).to.include('/テスト.docx');
      });

      it('bulk previews selection and displays success toast', async () => {
        sidekickTest.mockFetchDirectoryStatusSuccess(HelixMockContentSources.SHAREPOINT, {
          webPath: '/foo',
        });
        await appStore.loadContext(sidekickTest.sidekick, sidekickTest.config);
        sidekickTest.toggleAdminItems([
          'document',
          'spreadsheet',
          'other',
        ]);
        await waitUntil(() => bulkStore.selection.length === 3);

        await bulkStore.preview();
        await confirmDialog(sidekickTest.sidekick);

        await waitUntil(() => startJobStub.calledWith('preview', [
          '/foo/document',
          '/foo/spreadsheet.json',
          '/foo/other.unknown',
        ]));
        await waitUntil(() => getJobStub.calledWith('preview', '123'), null, { timeout: 2000 });
        expect(bulkStore.progress.processed).to.equal(1);

        // now getJob() returns stopped job and includes details if requested
        getJobStub.callsFake(async (topic, name, details) => ({
          topic,
          name,
          state: 'stopped',
          progress: {
            total: 3,
            processed: 3,
            failed: 0,
          },
          data: details ? {
            resources: [
              { path: '/foo/document', status: 200 },
              { path: '/foo/spreadsheet.json', status: 304 },
              { path: '/foo/other', status: 200 },
            ],
          } : undefined,
        }));
        await waitUntil(() => getJobStub.calledWith('preview', '123'));
        await waitUntil(() => getJobStub.calledWith('preview', '123', true), null, { timeout: 2000 });

        await waitUntil(() => showToastSpy.called);
        expect(showToastSpy.calledWithMatch({
          message: 'Preview of 3 files successfully generated.',
          variant: 'positive',
        })).to.be.true;
        expect(fireEventStub.calledWithMatch('previewed')).to.be.true;

        // test toast actions
        const activityAction = recursiveQuery(sidekickTest.sidekick, 'activity-action');
        const copyUrlsButton = recursiveQuery(activityAction, 'sp-action-button:nth-of-type(1)');
        expect(copyUrlsButton.textContent.trim()).to.equal('Copy 3 URLs');
        const openUrlsButton = recursiveQuery(activityAction, 'sp-action-button:nth-of-type(2)');
        expect(openUrlsButton.textContent.trim()).to.equal('Open 3 URLs');
        copyUrlsButton.click();
        openUrlsButton.click();
        await waitUntil(() => copyUrlsSpy.calledWithMatch(appStore.siteStore.innerHost));
        await waitUntil(() => openUrlsSpy.calledWithMatch(appStore.siteStore.innerHost));
      }).timeout(10000);

      it('bulk activates config file', async () => {
        updateStub.resolves(true);
        sidekickTest.mockFetchDirectoryStatusSuccess(HelixMockContentSources.SHAREPOINT, {
          webPath: '/.helix',
        });
        await appStore.loadContext(sidekickTest.sidekick, sidekickTest.config);
        sidekickTest.bulkRoot.querySelector('#appRoot .file')
          .insertAdjacentHTML('beforebegin', mockSharePointFile({
            path: 'config',
            file: 'config.xslx',
            type: 'xlsx',
          }));
        sidekickTest.toggleAdminItems([
          'config',
        ]);
        await waitUntil(() => bulkStore.selection.length === 1);
        await bulkStore.preview();

        // confirm dialog says activate instead of preview
        await waitUntil(() => recursiveQuery(sidekickTest.sidekick, 'sp-dialog-wrapper'));
        const dialogWrapper = recursiveQuery(sidekickTest.sidekick, 'sp-dialog-wrapper');
        expect(recursiveQuery(dialogWrapper, 'h2').textContent.trim()).to.equal('Activate');
        expect(recursiveQuery(dialogWrapper, 'sp-button[variant="accent"]').textContent.trim()).to.equal('Activate');

        dialogWrapper.dispatchEvent(new CustomEvent(MODAL_EVENTS.CONFIRM));
        await waitUntil(() => updateStub.called);

        expect(showToastSpy.calledWith({
          message: 'Configuration successfully activated.',
          variant: 'positive',
        })).to.be.true;
        expect(fireEventStub.calledWithMatch('previewed')).to.be.true;

        // no toast actions
        await waitUntil(() => recursiveQuery(sidekickTest.sidekick, 'activity-action'));
        const toast = recursiveQuery(sidekickTest.sidekick, 'activity-action');
        const buttons = [...recursiveQueryAll(toast, 'sp-action-button:not(.close)')];
        expect(buttons.length).to.equal(0);
      }).timeout(10000);

      it('refuses to bulk activate multiple config files', async () => {
        sidekickTest.mockFetchDirectoryStatusSuccess(HelixMockContentSources.SHAREPOINT, {
          webPath: '/.helix',
        });
        await appStore.loadContext(sidekickTest.sidekick, sidekickTest.config);
        sidekickTest.bulkRoot.querySelector('#appRoot .file')
          .insertAdjacentHTML('beforebegin', mockSharePointFile({
            path: 'config',
            file: 'config.xslx',
            type: 'xlsx',
          }));
        sidekickTest.bulkRoot.querySelector('#appRoot .file')
          .insertAdjacentHTML('beforebegin', mockSharePointFile({
            path: 'headers',
            file: 'headers.xslx',
            type: 'xlsx',
          }));
        sidekickTest.toggleAdminItems([
          'config',
          'headers',
        ]);
        await waitUntil(() => bulkStore.selection.length === 2);
        await bulkStore.preview();

        await waitUntil(() => showToastSpy.called);
        expect(showToastSpy.calledWith({
          message: 'Activation of multiple configurations not supported.',
          variant: 'warning',
          timeout: 0,
        })).to.be.true;
      }).timeout(10000);

      it('bulk previews selection and displays partial success toast', async () => {
        sidekickTest.toggleAdminItems(['document', 'spreadsheet']);
        await waitUntil(() => bulkStore.selection.length === 2);

        await bulkStore.preview();
        await confirmDialog(sidekickTest.sidekick);

        await waitUntil(() => startJobStub.calledWith('preview', ['/document', '/spreadsheet.json']));
        await waitUntil(() => getJobStub.calledWith('preview', '123'), null, { timeout: 2000 });
        expect(bulkStore.progress.processed).to.equal(1);

        // now getJob() returns stopped job and includes details if requested
        getJobStub.callsFake(async (topic, name, details) => ({
          topic,
          name,
          state: 'stopped',
          progress: {
            total: 2,
            processed: 2,
            failed: 1,
          },
          data: details ? {
            resources: [
              { path: '/document', status: 200 },
              { path: '/spreadsheet.json', status: 404 },
            ],
          } : undefined,
        }));
        await waitUntil(() => getJobStub.calledWith('preview', '123'));
        await waitUntil(() => getJobStub.calledWith('preview', '123', true), null, { timeout: 2000 });

        await waitUntil(() => showToastSpy.called);
        expect(showToastSpy.calledWithMatch({
          message: 'Preview of 1 file successfully generated, but 1 failed.',
          variant: 'warning',
        })).to.be.true;
      }).timeout(10000);

      it('bulk previews selection and displays failure toast', async () => {
        sidekickTest.toggleAdminItems(['document', 'spreadsheet']);
        await waitUntil(() => bulkStore.selection.length === 2);

        await bulkStore.preview();
        await confirmDialog(sidekickTest.sidekick);

        await waitUntil(() => startJobStub.calledWith('preview', ['/document', '/spreadsheet.json']));
        await waitUntil(() => getJobStub.calledWith('preview', '123'), null, { timeout: 2000 });
        expect(bulkStore.progress.processed).to.equal(1);

        // now getJob() returns stopped job and includes details if requested
        getJobStub.callsFake(async (topic, name, details) => ({
          topic,
          name,
          state: 'stopped',
          progress: {
            total: 2,
            processed: 2,
            failed: 2,
          },
          data: details ? {
            resources: [
              { path: '/document', status: 502 },
              { path: '/spreadsheet.json', status: 404 },
            ],
          } : undefined,
        }));
        await waitUntil(() => getJobStub.calledWith('preview', '123'));
        await waitUntil(() => getJobStub.calledWith('preview', '123', true), null, { timeout: 2000 });

        await waitUntil(() => showToastSpy.called);
        expect(showToastSpy.calledWithMatch({
          message: 'Failed to generate preview of all files.',
          variant: 'negative',
        })).to.be.true;

        // test toast action
        const activityAction = recursiveQuery(sidekickTest.sidekick, 'activity-action');
        const detailsButton = recursiveQuery(activityAction, 'sp-action-button');
        expect(detailsButton.textContent.trim()).to.equal('Details');
        detailsButton.click();
        await waitUntil(() => showModalSpy.calledWithMatch({
          type: MODALS.BULK,
        }));
      }).timeout(10000);

      it('start job fails', async () => {
        startJobStub.resolves(null);
        sidekickTest.toggleAdminItems(['document', 'spreadsheet']);
        await waitUntil(() => bulkStore.selection.length === 2);

        await bulkStore.preview();
        await confirmDialog(sidekickTest.sidekick);

        await waitUntil(() => startJobStub.called);
        await aTimeout(100);

        expect(setStateSpy.calledWith());
        expect(getJobStub.called).to.be.false;
        expect(showToastSpy.called).to.be.false;
      }).timeout(10000);

      it('start job response contains no job', async () => {
        startJobStub.resolves({ job: null });
        sidekickTest.toggleAdminItems(['document', 'spreadsheet']);
        await waitUntil(() => bulkStore.selection.length === 2);

        await bulkStore.preview();
        await confirmDialog(sidekickTest.sidekick);

        await waitUntil(() => startJobStub.called);
        await aTimeout(100);

        expect(setStateSpy.calledWith());
        expect(getJobStub.called).to.be.false;
        expect(showToastSpy.called).to.be.false;
      }).timeout(10000);

      it('stops polling if get job fails', async () => {
        const clearIntervalSpy = sidekickTest.sandbox.spy(window, 'clearInterval');
        sidekickTest.toggleAdminItems(['document', 'spreadsheet']);
        await waitUntil(() => bulkStore.selection.length === 2);

        await bulkStore.preview();
        await confirmDialog(sidekickTest.sidekick);

        await waitUntil(() => getJobStub.called, null, { timeout: 3000 });

        // next get job call fails
        getJobStub.resolves(null);

        await waitUntil(() => getJobStub.called, null, { timeout: 3000 });
        await waitUntil(() => clearIntervalSpy.called, null, { timeout: 3000 });
      }).timeout(10000);

      it('get job returns null', async () => {
        getJobStub.resolves(null);
        sidekickTest.toggleAdminItems(['document', 'spreadsheet']);
        await waitUntil(() => bulkStore.selection.length === 2);

        await bulkStore.preview();
        await confirmDialog(sidekickTest.sidekick);

        await waitUntil(() => getJobStub.calledOnce, '', { timeout: 3000 });
        // make sure polling has stopped
        await aTimeout(1100);

        expect(getJobStub.callCount).to.equal(1);
      }).timeout(10000);

      it('get job response contains no progress', async () => {
        getJobStub.resolves({ state: 'running', progress: null });
        sidekickTest.toggleAdminItems(['document', 'spreadsheet']);
        await waitUntil(() => bulkStore.selection.length === 2);

        await bulkStore.preview();
        await confirmDialog(sidekickTest.sidekick);

        await waitUntil(() => getJobStub.calledTwice, '', { timeout: 3000 });

        expect(bulkStore.progress.processed).to.equal(0);
      }).timeout(10000);

      it('get job details reponse contains no data', async () => {
        getJobStub.resolves({
          state: 'stopped',
          progress: {
            total: 2,
            processed: 2,
            failed: 0,
          },
        });
        sidekickTest.toggleAdminItems(['document', 'spreadsheet']);
        await waitUntil(() => bulkStore.selection.length === 2);

        await bulkStore.preview();
        await confirmDialog(sidekickTest.sidekick);

        await waitUntil(() => getJobStub.calledTwice, '', { timeout: 3000 });

        expect(fireEventStub.calledWithMatch('previewed')).to.be.false;
      }).timeout(10000);

      it('single file does not start job', async () => {
        sidekickTest.toggleAdminItems(['document']);
        await waitUntil(() => bulkStore.selection.length === 1);

        await bulkStore.preview();
        await confirmDialog(sidekickTest.sidekick);

        await waitUntil(() => updateStub.called);
        expect(updateStub.calledWith('/document')).to.be.true;
        expect(startJobStub.called).to.be.false;
      });

      it('single file success', async () => {
        updateStub.resolves(true);
        sidekickTest.toggleAdminItems(['document']);
        await waitUntil(() => bulkStore.selection.length === 1);

        await bulkStore.preview();
        await confirmDialog(sidekickTest.sidekick);

        await waitUntil(() => updateStub.called);
        await waitUntil(() => showToastSpy.called);
        expect(showToastSpy.calledWithMatch({
          message: 'Preview of this file successfully generated.',
        })).to.be.true;
      });

      it('single file failure', async () => {
        updateStub.callsFake(() => {
          // admin client shows error toast
          appStore.showToast({
            message: 'Failed to generate preview',
            variant: 'negative',
          });
          return false;
        });
        sidekickTest.toggleAdminItems(['document']);
        await waitUntil(() => bulkStore.selection.length === 1);

        await bulkStore.preview();
        await confirmDialog(sidekickTest.sidekick);

        await waitUntil(() => updateStub.called);
        // do not overwrite existing error toast
        expect(appStore.state).to.equal(STATE.TOAST);
      });

      it('handles path transformations', async () => {
        sidekickTest.toggleAdminItems(['index', 'image.jpg']);
        await waitUntil(() => bulkStore.selection.length === 2);

        await bulkStore.preview();
        await confirmDialog(sidekickTest.sidekick);

        await waitUntil(() => startJobStub.called);
        expect(startJobStub.calledWith('preview', ['/', '/image.jpg'])).to.be.true;
      });
    });

    describe('publish', () => {
      it('handles emtpy selection', async () => {
        const debugStub = sidekickTest.sandbox.stub(log, 'debug');

        await bulkStore.publish();

        await waitUntil(() => debugStub.called);
      });

      it('bulk publishes selection and displays success toast', async () => {
        sidekickTest.toggleAdminItems(['document', 'spreadsheet']);
        await waitUntil(() => bulkStore.selection.length === 2);

        await bulkStore.publish();
        await confirmDialog(sidekickTest.sidekick);

        await waitUntil(() => startJobStub.calledWith('live', ['/document', '/spreadsheet.json']));
        await waitUntil(() => getJobStub.calledWith('publish', '123'), null, { timeout: 2000 });
        expect(bulkStore.progress.processed).to.equal(1);

        // now getJob() returns stopped job and includes details if requested
        getJobStub.callsFake(async (topic, name, details) => ({
          topic,
          name,
          state: 'stopped',
          progress: {
            total: 2,
            processed: 2,
            failed: 0,
          },
          data: details ? {
            resources: [
              { path: '/document', status: 200 },
              { path: '/spreadsheet.json', status: 304 },
            ],
          } : undefined,
        }));
        await waitUntil(() => getJobStub.calledWith('publish', '123'), null, { timeout: 2000 });
        await waitUntil(() => getJobStub.calledWith('publish', '123', true), null, { timeout: 2000 });

        await waitUntil(() => showToastSpy.called);
        expect(showToastSpy.calledWithMatch({
          message: '2 files successfully published.',
          variant: 'positive',
        })).to.be.true;
        expect(fireEventStub.calledWithMatch('published')).to.be.true;

        // test toast actions
        const activityAction = recursiveQuery(sidekickTest.sidekick, 'activity-action');
        const copyUrlsButton = recursiveQuery(activityAction, 'sp-action-button:nth-of-type(1)');
        expect(copyUrlsButton.textContent.trim()).to.equal('Copy 2 URLs');
        const openUrlsButton = recursiveQuery(activityAction, 'sp-action-button:nth-of-type(2)');
        expect(openUrlsButton.textContent.trim()).to.equal('Open 2 URLs');
        copyUrlsButton.click();
        openUrlsButton.click();
        await waitUntil(() => copyUrlsSpy.calledWithMatch(appStore.siteStore.host || appStore.siteStore.outerHost));
        await waitUntil(() => openUrlsSpy.calledWithMatch(appStore.siteStore.host || appStore.siteStore.outerHost));
      }).timeout(10000);

      it('bulk publishes selection and displays partial success toast', async () => {
        sidekickTest.toggleAdminItems(['document', 'spreadsheet']);
        await waitUntil(() => bulkStore.selection.length === 2);

        await bulkStore.publish();
        await confirmDialog(sidekickTest.sidekick);

        await waitUntil(() => startJobStub.calledWith('live', ['/document', '/spreadsheet.json']));
        await waitUntil(() => getJobStub.calledWith('publish', '123'), null, { timeout: 2000 });
        expect(bulkStore.progress.processed).to.equal(1);

        // now getJob() returns stopped job and includes details if requested
        getJobStub.callsFake(async (topic, name, details) => ({
          topic,
          name,
          state: 'stopped',
          progress: {
            total: 2,
            processed: 2,
            failed: 1,
          },
          data: details ? {
            resources: [
              { path: '/document', status: 200 },
              { path: '/spreadsheet.json', status: 404 },
            ],
          } : undefined,
        }));
        await waitUntil(() => getJobStub.calledWith('publish', '123'));
        await waitUntil(() => getJobStub.calledWith('publish', '123', true), null, { timeout: 2000 });

        await waitUntil(() => showToastSpy.called);

        expect(showToastSpy.calledWithMatch({
          message: '1 file successfully published, but 1 failed.',
          variant: 'warning',
        })).to.be.true;
      }).timeout(10000);

      it('bulk publishes selection and displays failure toast', async () => {
        sidekickTest.toggleAdminItems(['document', 'spreadsheet']);
        await waitUntil(() => bulkStore.selection.length === 2);

        await bulkStore.publish();
        await confirmDialog(sidekickTest.sidekick);

        await waitUntil(() => startJobStub.calledWith('live', ['/document', '/spreadsheet.json']));
        await waitUntil(() => getJobStub.calledWith('publish', '123'), null, { timeout: 2000 });
        expect(bulkStore.progress.processed).to.equal(1);

        // now getJob() returns stopped job and includes details if requested
        getJobStub.callsFake(async (topic, name, details) => ({
          topic,
          name,
          state: 'stopped',
          progress: {
            total: 2,
            processed: 2,
            failed: 2,
          },
          data: details ? {
            resources: [
              { path: '/document', status: 502 },
              { path: '/spreadsheet.json', status: 404 },
            ],
          } : undefined,
        }));
        await waitUntil(() => getJobStub.calledWith('publish', '123'));
        await waitUntil(() => getJobStub.calledWith('publish', '123', true), null, { timeout: 2000 });

        await waitUntil(() => showToastSpy.called);
        expect(showToastSpy.calledWithMatch({
          message: 'Failed to publish all files.',
          variant: 'negative',
        })).to.be.true;
      }).timeout(10000);

      it('start job fails', async () => {
        startJobStub.resolves(null);
        sidekickTest.toggleAdminItems(['document', 'spreadsheet']);
        await waitUntil(() => bulkStore.selection.length === 2);

        await bulkStore.publish();
        await confirmDialog(sidekickTest.sidekick);

        await waitUntil(() => startJobStub.called);
        await aTimeout(100);

        expect(setStateSpy.calledWith());
        expect(getJobStub.called).to.be.false;
        expect(showToastSpy.called).to.be.false;
      }).timeout(10000);

      it('start job response contains no job', async () => {
        startJobStub.resolves({ job: null });
        sidekickTest.toggleAdminItems(['document', 'spreadsheet']);
        await waitUntil(() => bulkStore.selection.length === 2);

        await bulkStore.publish();
        await confirmDialog(sidekickTest.sidekick);

        await waitUntil(() => startJobStub.called);
        await aTimeout(100);

        expect(setStateSpy.calledWith());
        expect(getJobStub.called).to.be.false;
        expect(showToastSpy.called).to.be.false;
      }).timeout(10000);

      it('stops polling if get job fails', async () => {
        const clearIntervalSpy = sidekickTest.sandbox.spy(window, 'clearInterval');
        sidekickTest.toggleAdminItems(['document', 'spreadsheet']);
        await waitUntil(() => bulkStore.selection.length === 2);

        await bulkStore.publish();
        await confirmDialog(sidekickTest.sidekick);

        await waitUntil(() => getJobStub.called, null, { timeout: 3000 });

        // next get job call fails
        getJobStub.resolves(null);

        await waitUntil(() => getJobStub.called, null, { timeout: 3000 });
        await waitUntil(() => clearIntervalSpy.called, null, { timeout: 3000 });
      }).timeout(10000);

      it('get job response contains no progress', async () => {
        getJobStub.resolves({ state: 'running', progress: null });
        sidekickTest.toggleAdminItems(['document', 'spreadsheet']);
        await waitUntil(() => bulkStore.selection.length === 2);

        await bulkStore.publish();
        await confirmDialog(sidekickTest.sidekick);

        await waitUntil(() => getJobStub.calledTwice, '', { timeout: 3000 });

        expect(bulkStore.progress.processed).to.equal(0);
      }).timeout(10000);

      it('get job details reponse contains no data', async () => {
        getJobStub.resolves({
          state: 'stopped',
          progress: {
            total: 2,
            processed: 2,
            failed: 0,
          },
        });
        sidekickTest.toggleAdminItems(['document', 'spreadsheet']);
        await waitUntil(() => bulkStore.selection.length === 2);

        await bulkStore.publish();
        await confirmDialog(sidekickTest.sidekick);

        await waitUntil(() => getJobStub.calledTwice, '', { timeout: 3000 });

        expect(fireEventStub.calledWithMatch('published')).to.be.false;
      }).timeout(10000);

      it('single file does not start job', async () => {
        appStore.siteStore.host = null;
        sidekickTest.toggleAdminItems(['document']);
        await waitUntil(() => bulkStore.selection.length === 1);

        await bulkStore.publish();
        await confirmDialog(sidekickTest.sidekick);

        await waitUntil(() => publishStub.called);
        expect(publishStub.calledWith('/document')).to.be.true;
        expect(startJobStub.called).to.be.false;
      });

      it('single file success', async () => {
        publishStub.resolves(true);
        sidekickTest.toggleAdminItems(['document']);
        await waitUntil(() => bulkStore.selection.length === 1);

        await bulkStore.publish();
        await confirmDialog(sidekickTest.sidekick);

        await waitUntil(() => publishStub.called);
        await waitUntil(() => showToastSpy.called);
        expect(showToastSpy.calledWithMatch({
          message: 'File successfully published.',
        })).to.be.true;
      });

      it('single file failure', async () => {
        publishStub.callsFake(() => {
          // admin client shows error toast
          appStore.showToast({
            message: 'Publication failed',
            variant: 'negative',
          });
          return false;
        });
        sidekickTest.toggleAdminItems(['document']);
        await waitUntil(() => bulkStore.selection.length === 1);

        await bulkStore.publish();
        await confirmDialog(sidekickTest.sidekick);

        await waitUntil(() => publishStub.called);
        // do not overwrite existing error toast
        expect(appStore.state).to.equal(STATE.TOAST);
      });
    });

    describe('copyUrls', () => {
      const host = 'main--aem-boilerplate--adobe.aem.page';

      it('handles emtpy selection', async () => {
        const debugStub = sidekickTest.sandbox.stub(log, 'debug');

        await bulkStore.copyUrls(host);

        await waitUntil(() => debugStub.called);
      });

      it('handles single selection', async () => {
        sidekickTest.toggleAdminItems(['document']);

        await waitUntil(() => bulkStore.selection.length === 1);

        await bulkStore.copyUrls();

        await waitUntil(() => writeTextStub.called);
        expect(writeTextStub.calledOnceWith(`https://${appStore.siteStore.innerHost}/document`)).to.be.true;
      });

      it('creates urls from bulk selection and copies them to clipboard', async () => {
        sidekickTest.toggleAdminItems(['document', 'spreadsheet']);
        await waitUntil(() => bulkStore.selection.length === 2);

        await bulkStore.copyUrls(host);

        await waitUntil(() => writeTextStub.called);
        expect(writeTextStub.calledWith([
          `https://${host}/document`,
          `https://${host}/spreadsheet.json`,
        ].join('\n'))).to.be.true;
      });

      it('creates urls from paths and copies them to clipboard', async () => {
        await bulkStore.copyUrls(host, ['/document', '/spreadsheet.json']);

        await waitUntil(() => writeTextStub.called);
        expect(writeTextStub.calledWith([
          `https://${host}/document`,
          `https://${host}/spreadsheet.json`,
        ].join('\n'))).to.be.true;
      });

      it('navigator.cliboard.writeText throws error due to missing document focus', async () => {
        writeTextStub.throws(new Error('Document is not focused.'));
        await bulkStore.copyUrls(host, ['/document', '/spreadsheet.json']);

        await waitUntil(() => writeTextStub.called);
        expect(showToastSpy.calledWith({
          message: 'Copy to clipboard failed. Please make sure the window remains focused.',
          variant: 'negative',
        })).to.be.true;
      });

      it('navigator.cliboard.writeText throws error', async () => {
        writeTextStub.throws(error);
        await bulkStore.copyUrls(host, ['/document', '/spreadsheet.json']);

        await waitUntil(() => writeTextStub.called);
        expect(showToastSpy.calledWith({
          message: 'Copy to clipboard failed. Please try again.',
          variant: 'negative',
        })).to.be.true;
      });
    });

    describe('openUrls', () => {
      const host = 'main--aem-boilerplate--adobe.aem.page';

      it('handles emtpy selection', async () => {
        const debugStub = sidekickTest.sandbox.stub(log, 'debug');

        await bulkStore.openUrls(host);

        await waitUntil(() => debugStub.called);
      });

      it('handles single selection', async () => {
        sidekickTest.toggleAdminItems(['document']);

        await waitUntil(() => bulkStore.selection.length === 1);

        await bulkStore.openUrls(host);

        await waitUntil(() => openPageStub.called);
        expect(openPageStub.calledOnceWith(`https://${host}/document`)).to.be.true;
      });

      it('creates urls from bulk selection and opens them', async () => {
        sidekickTest.toggleAdminItems(['document', 'spreadsheet']);

        await waitUntil(() => bulkStore.selection.length === 2);

        await bulkStore.openUrls(host);

        await waitUntil(() => openPageStub.called);
        expect(openPageStub.calledWith(`https://${host}/document`)).to.be.true;
        expect(openPageStub.calledWith(`https://${host}/spreadsheet.json`)).to.be.true;
      });

      it('creates urls from paths and opens them', async () => {
        await bulkStore.openUrls(host, ['/document', '/spreadsheet.json']);

        await waitUntil(() => openPageStub.called);
        expect(openPageStub.calledWith(`https://${host}/document`)).to.be.true;
        expect(openPageStub.calledWith(`https://${host}/spreadsheet.json`)).to.be.true;
      });

      it('asks for confirmation before opening more than 10 urls', async () => {
        await bulkStore.openUrls(null, [
          '/document/1',
          '/document/2',
          '/document/3',
          '/document/4',
          '/document/5',
          '/document/6',
          '/document/7',
          '/document/8',
          '/document/9',
          '/document/10',
          '/document/11',
        ]);

        await waitUntil(() => recursiveQuery(sidekickTest.sidekick, 'sp-dialog-wrapper'));

        expect(showModalSpy.calledWithMatch({
          type: MODALS.CONFIRM,
          data: {
            message: 'Are you sure you want to open 11 URLs?',
          },
        })).to.be.true;
        await confirmDialog(sidekickTest.sidekick);

        await waitUntil(() => openPageStub.callCount === 11);
        expect(openPageStub.calledWith(`https://${appStore.siteStore.innerHost}/document/11`)).to.be.true;
      });
    });
  });

  describe('more cases', () => {
    beforeEach(() => {
      appStore = new AppStore();
      bulkStore = appStore.bulkStore;
      sidekickTest = new SidekickTest(defaultSidekickConfig, appStore);
      sidekickTest
        .mockFetchStatusSuccess()
        .mockFetchDirectoryStatusSuccess()
        .mockFetchSidekickConfigSuccess(true, false);
    });

    it('unknown file type in gdrive', async () => {
      // mock gdrive
      sidekickTest
        .mockLocation(getAdminLocation(HelixMockContentSources.GDRIVE))
        .mockAdminDOM(HelixMockContentSources.GDRIVE);
      await appStore.loadContext(sidekickTest.createSidekick(), sidekickTest.config);
      await aTimeout(500);

      // delete file icon to simulate unknown file type
      sidekickTest.toggleAdminItems(['document']);
      sidekickTest.bulkRoot.querySelector('.file[aria-selected="true"] svg').remove();
      bulkStore.initStore(appStore.location);
      await waitUntil(() => bulkStore.selection.length === 1);

      expect(bulkStore.selection[0].type).to.equal('unknown');
    });

    it('docx in gdrive', async () => {
      const updateStub = sidekickTest.sandbox.stub(appStore, 'update');

      // mock gdrive
      sidekickTest
        .mockLocation(getAdminLocation(HelixMockContentSources.GDRIVE))
        .mockAdminDOM(HelixMockContentSources.GDRIVE);
      await appStore.loadContext(sidekickTest.createSidekick(), sidekickTest.config);
      await aTimeout(500);

      // add .docx extension to file name
      sidekickTest.bulkRoot
        .querySelector('#file-gdoc strong')
        .textContent = 'document.docx';
      sidekickTest.toggleAdminItems(['document']);

      bulkStore.initStore(appStore.location);
      await waitUntil(() => bulkStore.selection.length === 1);

      await bulkStore.preview();
      await confirmDialog(sidekickTest.sidekick);

      await waitUntil(() => updateStub.called);
      expect(updateStub.calledWith('/document.docx')).to.be.true;
    });

    it('xlsx in gdrive', async () => {
      const updateStub = sidekickTest.sandbox.stub(appStore, 'update');

      // mock gdrive
      sidekickTest
        .mockLocation(getAdminLocation(HelixMockContentSources.GDRIVE))
        .mockAdminDOM(HelixMockContentSources.GDRIVE);
      await appStore.loadContext(sidekickTest.createSidekick(), sidekickTest.config);
      await aTimeout(500);

      // add .xlsx extension to file name
      sidekickTest.bulkRoot
        .querySelector('#file-gsheet strong')
        .textContent = 'spreadsheet.xlsx';
      sidekickTest.toggleAdminItems(['spreadsheet']);

      bulkStore.initStore(appStore.location);
      await waitUntil(() => bulkStore.selection.length === 1);

      await bulkStore.preview();
      await confirmDialog(sidekickTest.sidekick);

      await waitUntil(() => updateStub.called);
      expect(updateStub.calledWith('/spreadsheet.xlsx')).to.be.true;
    });

    it('missing file name in sharepoint', async () => {
      // mock sharepoint
      sidekickTest
        .mockLocation(getAdminLocation(HelixMockContentSources.SHAREPOINT))
        .mockAdminDOM(HelixMockContentSources.SHAREPOINT);
      await appStore.loadContext(sidekickTest.createSidekick(), sidekickTest.config);
      await aTimeout(500);

      // remove file name from first file
      sidekickTest.bulkRoot.querySelector('[data-id="heroField"]').remove();
      // select first file
      sidekickTest.bulkRoot.querySelector('.file').setAttribute('aria-selected', 'true');

      bulkStore.initStore(appStore.location);
      await aTimeout(500);

      expect(bulkStore.selection.length).to.equal(0);
    });

    it('rejects illegal folder path', async () => {
      const showToastSpy = sidekickTest.sandbox.spy(appStore, 'showToast');

      // mock gdrive
      sidekickTest
        .mockLocation(getAdminLocation(HelixMockContentSources.GDRIVE))
        .mockAdminDOM(HelixMockContentSources.GDRIVE)
        .mockFetchDirectoryStatusSuccess(HelixMockContentSources.GDRIVE, {
          edit: {
            status: 200,
            sourceLocation: 'gdrive:driveid',
            contentType: 'application/folder',
            name: 'illegal folder',
            illegalPath: '/path/to/illegal folder',
          },
        });
      await appStore.loadContext(sidekickTest.createSidekick(), sidekickTest.config);
      await aTimeout(500);

      sidekickTest.toggleAdminItems(['document']);

      bulkStore.initStore(appStore.location);
      await waitUntil(() => bulkStore.selection.length === 1);

      await bulkStore.preview();

      await waitUntil(() => showToastSpy.called);
      expect(showToastSpy.calledWithMatch({
        variant: 'warning',
        timeout: 0,
      })).to.be.true;
    });

    it('getSummaryText: returns message based on succeeded vs failed', async () => {
      await appStore.loadContext(sidekickTest.createSidekick(), sidekickTest.config);
      expect(bulkStore.getSummaryText('preview', 4, 0))
        .to.equal('Preview of 4 files successfully generated.');

      await appStore.loadContext(sidekickTest.createSidekick(), sidekickTest.config);
      expect(bulkStore.getSummaryText('preview', 4, 2))
        .to.equal('Preview of 2 files successfully generated, but 2 failed.');

      await appStore.loadContext(sidekickTest.createSidekick(), sidekickTest.config);
      expect(bulkStore.getSummaryText('preview', 4, 3))
        .to.equal('Preview of 1 file successfully generated, but 3 failed.');

      await appStore.loadContext(sidekickTest.createSidekick(), sidekickTest.config);
      expect(bulkStore.getSummaryText('preview', 4, 4))
        .to.equal('Failed to generate preview of all files.');
    });
  });

  describe('url change', () => {
    let fetchStatusSpy;

    beforeEach(async () => {
      appStore = new AppStore();
      bulkStore = appStore.bulkStore;
      sidekickTest = new SidekickTest(defaultSidekickConfig, appStore);
      sidekickTest
        .mockFetchStatusSuccess()
        .mockFetchDirectoryStatusSuccess()
        .mockFetchSidekickConfigSuccess(true, false)
        .mockLocation(getAdminLocation(HelixMockContentSources.SHAREPOINT))
        .mockAdminDOM();
      fetchStatusSpy = sidekickTest.sandbox.spy(appStore, 'fetchStatus');
      await appStore.loadContext(sidekickTest.createSidekick(), sidekickTest.config);
    });

    it('refetches status', async () => {
      bulkStore.initStore(appStore.location);
      sidekickTest.toggleAdminItems(['document']);
      await waitUntil(() => bulkStore.selection.length === 1);

      // change location
      const input = document.getElementById('sidekick_test_location');
      input.setAttribute('value', `${input.getAttribute('value')}&new=1`);
      await aTimeout(500);

      await waitUntil(() => fetchStatusSpy.called);
      expect(fetchStatusSpy.callCount).to.be.greaterThan(1);
      expect(bulkStore.selection.length).to.equal(0);
    });
  });
});
