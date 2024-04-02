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

// @ts-ignore
import fetchMock from 'fetch-mock/esm/client.js';
import sinon from 'sinon';
import { aTimeout, expect, waitUntil } from '@open-wc/testing';
import { recursiveQuery } from '../../../test-utils.js';
import chromeMock from '../../../mocks/chrome.js';
import { AEMSidekick } from '../../../../src/extension/app/aem-sidekick.js';
import { mockFetchEnglishMessagesSuccess } from '../../../mocks/i18n.js';
import { defaultSidekickConfig } from '../../../fixtures/sidekick-config.js';
import {
  mockFetchConfigWithoutPluginsOrHostJSONSuccess,
  mockFetchStatusSuccess,
} from '../../../mocks/helix-admin.js';
import '../../../../src/extension/index.js';
import { appStore } from '../../../../src/extension/app/store/app.js';
import {
  HelixMockContentType,
  getDefaultHelixEnviromentLocations,
  mockHelixEnvironment, restoreEnvironment,
} from '../../../mocks/environment.js';
import { MODALS } from '../../../../src/extension/app/constants.js';

// @ts-ignore
window.chrome = chromeMock;

async function clickDeletePlugin(sidekick) {
  await waitUntil(() => recursiveQuery(sidekick, 'action-bar-picker'));

  // open plugin list
  const pluginList = recursiveQuery(sidekick, '.plugin-list');
  await waitUntil(() => pluginList.getAttribute('disabled') === null, 'pluginList is not disabled', { timeout: 3000 });
  pluginList.click();

  await waitUntil(() => recursiveQuery(sidekick, 'modal-container'), 'modal container never appeared', { timeout: 3000 });
  const modalContainer = recursiveQuery(sidekick, 'modal-container');
  await waitUntil(() => recursiveQuery(modalContainer, '.delete'));
  const deletePlugin = recursiveQuery(modalContainer, '.delete');
  expect(deletePlugin.textContent.trim()).to.equal('Delete');
  await waitUntil(() => deletePlugin.getAttribute('disabled') === null, 'delete plugin is not disabled', { timeout: 3000 });
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

async function closeToast(sidekick) {
  // click toast close button
  await waitUntil(() => recursiveQuery(sidekick, 'sp-toast') !== null);
  const toast = recursiveQuery(sidekick, 'sp-toast');
  const closeButton = recursiveQuery(toast, 'sp-close-button');
  closeButton.click();
}

describe('Delete plugin', () => {
  for (const contentType of [HelixMockContentType.DOC, HelixMockContentType.SHEET]) {
    describe(`deletes ${contentType}`, () => {
      const statusUrl = contentType === HelixMockContentType.SHEET
        ? 'https://admin.hlx.page/status/adobe/aem-boilerplate/main/placeholders.json?editUrl=auto'
        : 'https://admin.hlx.page/status/adobe/aem-boilerplate/main/?editUrl=auto';
      const sandbox = sinon.createSandbox();
      let sidekick;
      let deleteStub;
      let loadPageStub;
      let showModalSpy;
      let showToastSpy;
      let showWaitSpy;
      let hideWaitSpy;

      beforeEach(async () => {
        mockFetchEnglishMessagesSuccess();
        deleteStub = sandbox.stub(appStore, 'delete').resolves({ ok: true, status: 200 });
        loadPageStub = sandbox.stub(appStore, 'loadPage');
        showModalSpy = sandbox.spy(appStore, 'showModal');
        showToastSpy = sandbox.spy(appStore, 'showToast');
        showWaitSpy = sandbox.spy(appStore, 'showWait');
        hideWaitSpy = sandbox.spy(appStore, 'hideWait');

        mockFetchConfigWithoutPluginsOrHostJSONSuccess();
        mockHelixEnvironment(document, 'preview', contentType);

        sidekick = new AEMSidekick(defaultSidekickConfig);
        document.body.appendChild(sidekick);
      });

      afterEach(() => {
        document.body.removeChild(sidekick);
        fetchMock.reset();
        restoreEnvironment(document);
        sandbox.restore();
      });

      it('asks for user confirmation and redirects to the site root', async () => {
        // @ts-ignore
        sandbox.stub(appStore, 'showView').returns();
        mockFetchStatusSuccess(
          {
            webPath: contentType === HelixMockContentType.DOC ? '/' : '/placeholder.json',
            // source document is not found
            edit: { status: 404 },
            // preview delete permission is granted
            preview: {
              status: 200,
              permissions: ['read', 'write', 'delete'],
            },
          },
          null,
          statusUrl,
        );

        await clickDeletePlugin(sidekick);

        expect(showModalSpy.calledWithMatch({ type: MODALS.DELETE })).to.be.true;

        confirmDelete(sidekick);

        await waitUntil(() => deleteStub.calledOnce === true);

        expect(deleteStub.calledOnce).to.be.true;
        expect(showWaitSpy.calledOnce).to.be.true;
        expect(hideWaitSpy.calledOnce).to.be.true;
        expect(showToastSpy.calledOnce).to.be.true;

        await closeToast(sidekick);

        expect(loadPageStub.calledWith(
          `${getDefaultHelixEnviromentLocations(HelixMockContentType.DOC, 'hlx').preview}/`,
        )).to.be.true;
      }).timeout(20000);

      it('refuses to delete if user unauthenticated and source file still exists', async () => {
        mockFetchStatusSuccess(
          {
            webPath: contentType === HelixMockContentType.DOC ? '/' : '/placeholder.json',
            // preview delete permission is granted
            preview: {
              status: 200,
              permissions: ['read', 'write', 'delete'],
            },
            // user not authenticated
            profile: null,
          },
          null,
          statusUrl,
        );

        await clickDeletePlugin(sidekick);

        expect(showToastSpy.called).to.be.true;
      });

      it('allows authenticated user to delete if source file still exists', async () => {
        mockFetchStatusSuccess(
          {
            webPath: contentType === HelixMockContentType.DOC ? '/' : '/placeholder.json',
            edit: {
              status: 200,
            },
            // preview delete permission is granted
            preview: {
              status: 200,
              permissions: ['read', 'write', 'delete'],
            },
            // user authenticated
            profile: {
              email: 'foo@example.com',
              name: 'Peter Parker',
            },
          },
          null,
          statusUrl,
        );

        await clickDeletePlugin(sidekick);

        expect(showModalSpy.calledWithMatch({ type: MODALS.DELETE })).to.be.true;

        confirmDelete(sidekick);

        await waitUntil(() => deleteStub.calledOnce === true);
      });

      it('handles server failure', async () => {
        mockFetchStatusSuccess(
          {
            // source document is not found
            edit: { status: 404 },
            // preview delete permission is granted
            preview: {
              status: 200,
              permissions: ['read', 'write', 'delete'],
            },
          },
          null,
          statusUrl,
        );

        deleteStub.resolves({ ok: false, status: 500, headers: { 'x-error': 'something went wrong' } });

        await clickDeletePlugin(sidekick);

        expect(showModalSpy.calledWithMatch({ type: MODALS.DELETE })).to.be.true;

        confirmDelete(sidekick);

        await waitUntil(() => deleteStub.calledOnce === true);

        expect(showModalSpy.calledWithMatch({ type: MODALS.ERROR })).to.be.true;
      });
    });
  }
});
