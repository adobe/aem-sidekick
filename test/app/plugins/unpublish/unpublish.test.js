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

async function clickUnpublishPlugin(sidekick) {
  await waitUntil(() => recursiveQuery(sidekick, 'action-bar-picker'));

  // open plugin list
  const pluginList = recursiveQuery(sidekick, '.plugin-list');
  await waitUntil(() => pluginList.getAttribute('disabled') === null, 'pluginList is not disabled');
  pluginList.click();

  await waitUntil(() => recursiveQuery(sidekick, 'modal-container'), 'modal container never appeared');
  const modalContainer = recursiveQuery(sidekick, 'modal-container');
  await waitUntil(() => recursiveQuery(modalContainer, '.unpublish'));

  const unpublishPlugin = recursiveQuery(modalContainer, '.unpublish');
  expect(unpublishPlugin.textContent.trim()).to.equal('Unpublish');
  await waitUntil(() => unpublishPlugin.getAttribute('disabled') === null, 'unpublish plugin is not disabled');
  unpublishPlugin.click();

  await aTimeout(200);
}

function confirmUnpublish(sidekick) {
  // enter confirmation text
  const dialogWrapper = recursiveQuery(sidekick, 'sp-dialog-wrapper');
  const unpublishInput = recursiveQuery(dialogWrapper, 'sp-textfield');
  unpublishInput.value = 'UNPUBLISH';
  // click unpublish button
  const unpublishButton = recursiveQuery(sidekick, 'sp-button[variant="negative"]');
  unpublishButton.click();
}

async function closeToast(sidekick, variant = 'positive') {
  // click toast close button
  await waitUntil(() => recursiveQuery(sidekick, `action-bar.${variant}`) !== null);
  const toast = recursiveQuery(sidekick, '.toast-container');
  const closeButton = recursiveQuery(toast, 'sp-action-button.close');
  closeButton.click();
}

describe('Unpublish plugin', () => {
  describe('unpublishes page', () => {
    const sandbox = sinon.createSandbox();
    let sidekick;
    let unpublishStub;
    let loadPageStub;
    let showModalSpy;
    let showToastSpy;

    beforeEach(async () => {
      mockFetchEnglishMessagesSuccess();
      unpublishStub = sandbox.stub(appStore, 'unpublish').resolves({ ok: true, status: 200 });
      loadPageStub = sandbox.stub(appStore, 'loadPage');
      showModalSpy = sandbox.spy(appStore, 'showModal');
      showToastSpy = sandbox.spy(appStore, 'showToast');

      mockFetchConfigWithoutPluginsOrHostJSONSuccess();
      mockHelixEnvironment(document, 'preview');

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
      mockFetchStatusSuccess({
        webPath: '/foo',
        // source document is not found
        edit: { status: 404 },
        // live delete permission is granted
        live: {
          status: 200,
          permissions: ['read', 'write', 'delete'],
        },
      });

      await clickUnpublishPlugin(sidekick);

      expect(showModalSpy.calledWithMatch({ type: MODALS.DELETE })).to.be.true;

      confirmUnpublish(sidekick);

      await waitUntil(() => unpublishStub.calledOnce === true);

      expect(unpublishStub.calledOnce).to.be.true;
      expect(showToastSpy.calledOnce).to.be.true;

      await closeToast(sidekick);

      expect(loadPageStub.calledWith(
        `${getDefaultHelixEnviromentLocations(HelixMockContentType.DOC, 'hlx').preview}/`,
      )).to.be.true;
    });

    it('refuses to unpublish if user unauthenticated and source file still exists', async () => {
      mockFetchStatusSuccess({
        webPath: '/foo',
        // live delete permission is granted
        live: {
          status: 200,
          permissions: ['read', 'write', 'delete'],
        },
        // user not authenticated
        profile: null,
      });

      await clickUnpublishPlugin(sidekick);

      expect(showToastSpy.called).to.be.true;
    });

    it('allows authenticated user to delete if source file still exists', async () => {
      mockFetchStatusSuccess({
        webPath: '/foo',
        edit: {
          status: 200,
        },
        // live delete permission is granted
        live: {
          status: 200,
          permissions: ['read', 'write', 'delete'],
        },
        // user authenticated
        profile: {
          email: 'foo@example.com',
          name: 'Peter Parker',
        },
      });

      await clickUnpublishPlugin(sidekick);

      expect(showModalSpy.calledWithMatch({ type: MODALS.DELETE })).to.be.true;

      confirmUnpublish(sidekick);

      await waitUntil(() => unpublishStub.calledOnce === true);
    });

    it('handles server failure', async () => {
      mockFetchStatusSuccess({
        // source document is not found
        edit: { status: 404 },
        // live delete permission is granted
        live: {
          status: 200,
          permissions: ['read', 'write', 'delete'],
        },
      });

      unpublishStub.resolves({ ok: false, status: 500, headers: { 'x-error': 'something went wrong' } });

      await clickUnpublishPlugin(sidekick);

      expect(showModalSpy.calledWithMatch({ type: MODALS.DELETE })).to.be.true;

      confirmUnpublish(sidekick);

      await waitUntil(() => unpublishStub.calledOnce === true);
      expect(showToastSpy.args[0][0]).to.eq('Unpublication failed. Please try again later.');
      expect(showToastSpy.args[0][1]).to.eq('negative');
    });
  });
});
