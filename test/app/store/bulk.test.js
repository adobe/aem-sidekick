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
import { MODALS, MODAL_EVENTS } from '../../../src/extension/app/constants.js';
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
        beforeEach(() => {
          sidekickTest.mockAdminDOM(adminEnv, 'list', [
            { path: '/foo/image?.jpg', type: 'image' },
          ]);
          sidekickTest.toggleAdminItems(['image?.jpg']);
        });

        it('flags invalid file name', async () => {
          bulkStore.initStore(appStore.location);
          expect(bulkStore.selection.length).to.equal(1);
          expect(bulkStore.selection[0].file).to.equal('!ILLEGAL!_image?.jpg');
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
      openUrlsSpy = sidekickTest.sandbox.spy(bulkStore, 'openUrls');
      copyUrlsSpy = sidekickTest.sandbox.spy(bulkStore, 'copyUrls');
      showToastSpy = sidekickTest.sandbox.spy(appStore, 'showToast');
      showModalSpy = sidekickTest.sandbox.spy(appStore, 'showModal');
      setStateSpy = sidekickTest.sandbox.spy(appStore, 'setState');
    });

    describe('preview', () => {
      it('handles emtpy selection', async () => {
        const debugStub = sidekickTest.sandbox.stub(log, 'debug');
        bulkStore.initStore(appStore.location);

        await bulkStore.preview();

        await waitUntil(() => debugStub.called);
      });

      it('rejects selection with illegal path', async () => {
        // insert and select item with illegal file name
        sidekickTest.bulkRoot.querySelector('#appRoot .file')
          .insertAdjacentHTML('beforebegin', mockSharePointFile({
            path: '/foo/image?.jpg',
            file: 'image?.jpg',
            type: 'image',
          }));
        sidekickTest.toggleAdminItems(['image?.jpg']);
        bulkStore.initStore(appStore.location);
        await waitUntil(() => bulkStore.selection.length === 1);

        await bulkStore.preview();

        expect(startJobStub.called).to.be.false;
        expect(showToastSpy.calledWithMatch('The following file name contains illegal characters:', 'warning')).to.be.true;
      });

      it('bulk previews selection and displays success toast', async () => {
        sidekickTest.toggleAdminItems(['document', 'spreadsheet']);
        await waitUntil(() => bulkStore.selection.length === 2);

        await bulkStore.preview();
        await confirmDialog(sidekickTest.sidekick);

        await waitUntil(() => startJobStub.calledWith('preview', ['/document', '/spreadsheet.json']));
        await waitUntil(() => getJobStub.calledWith('preview', '123'));
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
        await waitUntil(() => getJobStub.calledWith('preview', '123'));
        await aTimeout(2000); // wait for polling to finish
        await waitUntil(() => getJobStub.calledWith('preview', '123', true));

        await waitUntil(() => showToastSpy.called);
        expect(showToastSpy.calledWithMatch(
          'Preview of 2 files successfully generated.',
          'positive',
        )).to.be.true;

        // test toast actions
        const activityAction = recursiveQuery(sidekickTest.sidekick, 'activity-action');
        const copyUrlsButton = recursiveQuery(activityAction, 'sp-action-button:nth-of-type(1)');
        expect(copyUrlsButton.textContent.trim()).to.equal('Copy URLs');
        const openUrlsButton = recursiveQuery(activityAction, 'sp-action-button:nth-of-type(2)');
        expect(openUrlsButton.textContent.trim()).to.equal('Open URLs');
        copyUrlsButton.click();
        openUrlsButton.click();
        await waitUntil(() => copyUrlsSpy.calledWithMatch(appStore.siteStore.innerHost));
        await waitUntil(() => openUrlsSpy.calledWithMatch(appStore.siteStore.innerHost));
      }).timeout(10000);

      it('bulk previews selection and displays partial success toast', async () => {
        sidekickTest.toggleAdminItems(['document', 'spreadsheet']);
        await waitUntil(() => bulkStore.selection.length === 2);

        await bulkStore.preview();
        await confirmDialog(sidekickTest.sidekick);

        await waitUntil(() => startJobStub.calledWith('preview', ['/document', '/spreadsheet.json']));
        await waitUntil(() => getJobStub.calledWith('preview', '123'));
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
        await aTimeout(2000); // wait for polling to finish
        await waitUntil(() => getJobStub.calledWith('preview', '123', true));

        await waitUntil(() => showToastSpy.called);
        expect(showToastSpy.calledWithMatch('but 1 failed', 'warning')).to.be.true;
      }).timeout(10000);

      it('bulk previews selection and displays failure toast', async () => {
        sidekickTest.toggleAdminItems(['document', 'spreadsheet']);
        await waitUntil(() => bulkStore.selection.length === 2);

        await bulkStore.preview();
        await confirmDialog(sidekickTest.sidekick);

        await waitUntil(() => startJobStub.calledWith('preview', ['/document', '/spreadsheet.json']));
        await waitUntil(() => getJobStub.calledWith('preview', '123'));
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
        await aTimeout(2000); // wait for polling to finish
        await waitUntil(() => getJobStub.calledWith('preview', '123', true));

        await waitUntil(() => showToastSpy.called);
        expect(showToastSpy.calledWithMatch('Failed to generate preview', 'negative')).to.be.true;

        // test toast action
        const activityAction = recursiveQuery(sidekickTest.sidekick, 'activity-action');
        const detailsButton = recursiveQuery(activityAction, 'sp-action-button');
        expect(detailsButton.textContent.trim()).to.equal('Details');
        detailsButton.click();
        await waitUntil(() => showModalSpy.calledWithMatch({
          type: MODALS.BULK_DETAILS,
        }));
      }).timeout(10000);

      it('start job fails', async () => {
        sidekickTest.toggleAdminItems(['document', 'spreadsheet']);
        await waitUntil(() => bulkStore.selection.length === 2);

        await bulkStore.preview();
        await confirmDialog(sidekickTest.sidekick);

        await waitUntil(() => startJobStub.calledWith('preview', ['/document', '/spreadsheet.json']));
        await waitUntil(() => getJobStub.calledWith('preview', '123'));
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
        await aTimeout(2000); // wait for polling to finish
        await waitUntil(() => getJobStub.calledWith('preview', '123', true));

        await waitUntil(() => showToastSpy.called);
        expect(showToastSpy.calledWithMatch('Failed to generate preview', 'negative')).to.be.true;
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
        expect(showToastSpy.calledWithMatch('Preview of this file successfully generated.')).to.be.true;
      });

      it('single file failure', async () => {
        updateStub.resolves(false);
        sidekickTest.toggleAdminItems(['document']);
        await waitUntil(() => bulkStore.selection.length === 1);

        await bulkStore.preview();
        await confirmDialog(sidekickTest.sidekick);

        await waitUntil(() => updateStub.called);
        await waitUntil(() => setStateSpy.called);
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

      it('rejects selection with illegal path', async () => {
        // insert and select item with illegal file name
        sidekickTest.bulkRoot.querySelector('#appRoot .file')
          .insertAdjacentHTML('beforebegin', mockSharePointFile({
            path: '/foo/image?.jpg',
            file: 'image?.jpg',
            type: 'image',
          }));
        sidekickTest.toggleAdminItems(['image?.jpg']);
        await waitUntil(() => bulkStore.selection.length === 1);

        await bulkStore.publish();

        expect(startJobStub.called).to.be.false;
        expect(showToastSpy.calledWithMatch('The following file name contains illegal characters:', 'warning')).to.be.true;
      });

      it('bulk publishes selection and displays success toast', async () => {
        sidekickTest.toggleAdminItems(['document', 'spreadsheet']);
        await waitUntil(() => bulkStore.selection.length === 2);

        await bulkStore.publish();
        await confirmDialog(sidekickTest.sidekick);

        await waitUntil(() => startJobStub.calledWith('live', ['/document', '/spreadsheet.json']));
        await waitUntil(() => getJobStub.calledWith('publish', '123'));
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
        await waitUntil(() => getJobStub.calledWith('publish', '123'));
        await aTimeout(2000); // wait for polling to finish
        await waitUntil(() => getJobStub.calledWith('publish', '123', true));

        await waitUntil(() => showToastSpy.called);
        expect(showToastSpy.calledWithMatch(
          '2 files successfully published.',
          'positive',
        )).to.be.true;

        // test toast actions
        const activityAction = recursiveQuery(sidekickTest.sidekick, 'activity-action');
        const copyUrlsButton = recursiveQuery(activityAction, 'sp-action-button:nth-of-type(1)');
        expect(copyUrlsButton.textContent.trim()).to.equal('Copy URLs');
        const openUrlsButton = recursiveQuery(activityAction, 'sp-action-button:nth-of-type(2)');
        expect(openUrlsButton.textContent.trim()).to.equal('Open URLs');
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
        await waitUntil(() => getJobStub.calledWith('publish', '123'));
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
        await aTimeout(2000); // wait for polling to finish
        await waitUntil(() => getJobStub.calledWith('publish', '123', true));

        await waitUntil(() => showToastSpy.called);
        expect(showToastSpy.calledWithMatch('but 1 failed', 'warning')).to.be.true;
      }).timeout(10000);

      it('bulk publishes selection and displays failure toast', async () => {
        sidekickTest.toggleAdminItems(['document', 'spreadsheet']);
        await waitUntil(() => bulkStore.selection.length === 2);

        await bulkStore.publish();
        await confirmDialog(sidekickTest.sidekick);

        await waitUntil(() => startJobStub.calledWith('live', ['/document', '/spreadsheet.json']));
        await waitUntil(() => getJobStub.calledWith('publish', '123'));
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
        await aTimeout(2000); // wait for polling to finish
        await waitUntil(() => getJobStub.calledWith('publish', '123', true));

        await waitUntil(() => showToastSpy.called);
        expect(showToastSpy.calledWithMatch('Failed to publish all files.', 'negative')).to.be.true;
      }).timeout(10000);

      it('single file does not start job', async () => {
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
        expect(showToastSpy.calledWithMatch('File successfully published.')).to.be.true;
      });

      it('single file failure', async () => {
        publishStub.resolves(false);
        sidekickTest.toggleAdminItems(['document']);
        await waitUntil(() => bulkStore.selection.length === 1);

        await bulkStore.publish();
        await confirmDialog(sidekickTest.sidekick);

        await waitUntil(() => publishStub.called);
        await waitUntil(() => setStateSpy.called);
      });
    });

    describe('copyUrls', () => {
      const host = 'main--aem-boilerplate--adobe.aem.page';

      it('handles emtpy selection', async () => {
        const debugStub = sidekickTest.sandbox.stub(log, 'debug');

        await bulkStore.copyUrls(host);

        await waitUntil(() => debugStub.called);
      });

      it('creates urls from bulk selection and copies them to clipboard', async () => {
        const writeTextStub = sidekickTest.sandbox.stub(navigator.clipboard, 'writeText');
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
        const writeTextStub = sidekickTest.sandbox.stub(navigator.clipboard, 'writeText');

        await bulkStore.copyUrls(host, ['/document', '/spreadsheet.json']);

        await waitUntil(() => writeTextStub.called);
        expect(writeTextStub.calledWith([
          `https://${host}/document`,
          `https://${host}/spreadsheet.json`,
        ].join('\n'))).to.be.true;
      });
    });

    describe('openUrls', () => {
      const host = 'main--aem-boilerplate--adobe.aem.page';

      it('handles emtpy selection', async () => {
        const debugStub = sidekickTest.sandbox.stub(log, 'debug');

        await bulkStore.openUrls(host);

        await waitUntil(() => debugStub.called);
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
    });
  });
});
