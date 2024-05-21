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

import { aTimeout, expect, waitUntil } from '@open-wc/testing';
import { recursiveQuery } from '../../../test-utils.js';
import chromeMock from '../../../mocks/chrome.js';
import { defaultSidekickConfig } from '../../../fixtures/sidekick-config.js';
import '../../../../src/extension/index.js';
import { AppStore } from '../../../../src/extension/app/store/app.js';
import {
  HelixMockContentType,
  HelixMockEnvironments,
  getDefaultHelixEnviromentLocations,
} from '../../../mocks/environment.js';
import { MODALS } from '../../../../src/extension/app/constants.js';
import { SidekickTest } from '../../../sidekick-test.js';

/**
 * The AEMSidekick object type
 * @typedef {import('../../../../src/extension/app/aem-sidekick.js').AEMSidekick} AEMSidekick
 */

// @ts-ignore
window.chrome = chromeMock;

async function expectDeletePlugin(sidekick, expected = true) {
  await waitUntil(() => recursiveQuery(sidekick, 'action-bar-picker'));

  // open plugin menu if present
  const pluginMenu = recursiveQuery(sidekick, '#plugin-menu');
  if (pluginMenu) {
    pluginMenu.click();
  }

  const deletePlugin = recursiveQuery(sidekick, '.delete');
  expect(deletePlugin !== undefined).to.equal(expected);
  return deletePlugin;
}

async function clickDeletePlugin(sidekick) {
  const deletePlugin = await expectDeletePlugin(sidekick, true);
  expect(deletePlugin.textContent.trim()).to.equal('Delete');
  await waitUntil(() => deletePlugin.getAttribute('disabled') === null, 'delete plugin is not disabled');
  deletePlugin.click();

  await aTimeout(200);
}

function confirmDelete(sidekick) {
  // enter confirmation text
  const dialogWrapper = recursiveQuery(sidekick, 'sp-dialog-wrapper');
  const deleteInput = recursiveQuery(dialogWrapper, 'sp-textfield');
  deleteInput.value = 'DELETE';
  // click delete button
  const deleteButton = recursiveQuery(sidekick, 'sp-button[variant="negative"]');
  deleteButton.click();
}

describe('Delete plugin', () => {
  for (const contentType of [HelixMockContentType.DOC, HelixMockContentType.SHEET]) {
    describe(`deletes ${contentType}`, () => {
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

      const statusUrl = contentType === HelixMockContentType.SHEET
        ? 'https://admin.hlx.page/status/adobe/aem-boilerplate/main/placeholders.json'
        : 'https://admin.hlx.page/status/adobe/aem-boilerplate/main/';
      let deleteStub;
      let loadPageStub;
      let showModalSpy;
      let showToastSpy;

      beforeEach(async () => {
        appStore = new AppStore();
        sidekickTest = new SidekickTest(defaultSidekickConfig, appStore);
        sidekickTest
          .mockFetchSidekickConfigSuccess(false, false)
          .mockHelixEnvironment(HelixMockEnvironments.PREVIEW, contentType);

        const { sandbox } = sidekickTest;
        deleteStub = sandbox.stub(appStore, 'delete').resolves(true);
        loadPageStub = sandbox.stub(appStore, 'loadPage');
        showModalSpy = sandbox.spy(appStore, 'showModal');
        showToastSpy = sandbox.spy(appStore, 'showToast');
      });

      afterEach(() => {
        sidekickTest.destroy();
      });

      it('no delete plugin if user not authorized', async () => {
        const { sandbox } = sidekickTest;
        // @ts-ignore
        sandbox.stub(appStore, 'showView').returns();
        sidekickTest.mockFetchStatusSuccess(false, null, null, statusUrl);
        sidekick = sidekickTest.createSidekick();
        await sidekickTest.awaitEnvSwitcher();
        await expectDeletePlugin(sidekick, false);
      });

      it('asks for user confirmation and redirects to the site root', async () => {
        const { sandbox } = sidekickTest;
        // @ts-ignore
        sandbox.stub(appStore, 'showView').returns();
        sidekickTest
          .mockFetchStatusSuccess(false, {
            webPath: contentType === HelixMockContentType.DOC ? '/' : '/placeholder.json',
            // source document is not found
            edit: { status: 404 },
            // preview delete permission is granted
            preview: {
              status: 200,
              sourceLocation: 'gdrive:drive-id',
              permissions: ['read', 'write', 'delete'],
            },
          }, null, statusUrl,
          );

        sidekick = sidekickTest.createSidekick();
        await sidekickTest.awaitEnvSwitcher();

        await clickDeletePlugin(sidekick);

        expect(showModalSpy.calledWithMatch({ type: MODALS.DELETE })).to.be.true;

        confirmDelete(sidekick);

        await waitUntil(() => deleteStub.calledOnce);

        sidekickTest.clickToastClose();

        expect(deleteStub.calledOnce).to.be.true;
        expect(showToastSpy.calledOnce).to.be.true;

        await waitUntil(() => loadPageStub.calledOnce);
        expect(loadPageStub.calledWith(
          `${getDefaultHelixEnviromentLocations(HelixMockContentType.DOC, 'hlx').preview}/`,
        )).to.be.true;
      });

      it('allows authenticated user to delete if source file still exists', async () => {
        sidekickTest
          .mockFetchStatusSuccess(false, {
            webPath: contentType === HelixMockContentType.DOC ? '/' : '/placeholder.json',
            edit: {
              status: 200,
            },
            // preview delete permission is granted
            preview: {
              status: 200,
              sourceLocation: 'gdrive:drive-id',
              permissions: ['read', 'write', 'delete'],
            },
            // user authenticated
            profile: {
              email: 'foo@example.com',
              name: 'Peter Parker',
            },
          }, null, statusUrl);

        sidekick = sidekickTest.createSidekick();
        await sidekickTest.awaitEnvSwitcher();

        await clickDeletePlugin(sidekick);

        expect(showModalSpy.calledWithMatch({ type: MODALS.DELETE })).to.be.true;

        confirmDelete(sidekick);

        await waitUntil(() => deleteStub.calledOnce);
      });

      it('handles server failure', async () => {
        sidekickTest
          .mockFetchStatusSuccess(false, {
          // source document is not found
            edit: { status: 404 },
            // preview delete permission is granted
            preview: {
              status: 200,
              sourceLocation: 'gdrive:drive-id',
              permissions: ['read', 'write', 'delete'],
            },
          }, null, statusUrl);

        sidekick = sidekickTest.createSidekick();
        await sidekickTest.awaitEnvSwitcher();

        deleteStub.resolves(false);

        await clickDeletePlugin(sidekick);

        expect(showModalSpy.calledWithMatch({ type: MODALS.DELETE })).to.be.true;

        confirmDelete(sidekick);

        await waitUntil(() => deleteStub.calledOnce);
        expect(deleteStub.calledOnce);
      });
    });
  }
});
