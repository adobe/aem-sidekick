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
  HelixMockEnvironments,
} from '../../../mocks/environment.js';
import { MODALS } from '../../../../src/extension/app/constants.js';
import { SidekickTest } from '../../../sidekick-test.js';

/**
 * The AEMSidekick object type
 * @typedef {import('../../../../src/extension/app/aem-sidekick.js').AEMSidekick} AEMSidekick
 */

// @ts-ignore
window.chrome = chromeMock;

async function expectUnpublishPlugin(sidekick, expected = true) {
  await waitUntil(() => recursiveQuery(sidekick, 'action-bar-picker'));

  // open plugin menu
  const pluginMenu = recursiveQuery(sidekick, '#plugin-menu');
  if (pluginMenu) {
    pluginMenu.click();
  }

  const deletePlugin = recursiveQuery(sidekick, '.unpublish');
  expect(deletePlugin !== undefined).to.equal(expected);
  return deletePlugin;
}

async function clickUnpublishPlugin(sidekick) {
  const unpublishPlugin = await expectUnpublishPlugin(sidekick, true);
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

describe('Unpublish plugin', () => {
  describe('unpublishes page', () => {
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

    let unpublishStub;
    let reloadPageStub;
    let showModalSpy;
    let showToastSpy;

    beforeEach(async () => {
      appStore = new AppStore();
      sidekickTest = new SidekickTest(defaultSidekickConfig, appStore);
      sidekickTest
        .mockFetchSidekickConfigSuccess(false, false)
        .mockHelixEnvironment(HelixMockEnvironments.PREVIEW);

      const { sandbox } = sidekickTest;
      unpublishStub = sandbox.stub(appStore, 'unpublish').resolves(true);
      reloadPageStub = sandbox.stub(appStore, 'reloadPage');
      showModalSpy = sandbox.spy(appStore, 'showModal');
      showToastSpy = sandbox.spy(appStore, 'showToast');

      sidekick = sidekickTest.createSidekick();
    });

    afterEach(() => {
      sidekickTest.destroy();
    });

    it('no unpublish plugin if user not authorized', async () => {
      const { sandbox } = sidekickTest;
      // @ts-ignore
      sandbox.stub(appStore, 'showView').returns();
      sidekickTest.mockFetchStatusSuccess();
      await expectUnpublishPlugin(sidekick, false);
    });

    it('asks for user confirmation and reloads page after toast timeout', async () => {
      sidekickTest
        .mockFetchStatusSuccess(false, {
          webPath: '/foo',
          // live delete permission is granted
          live: {
            status: 200,
            permissions: ['read', 'write', 'delete'],
          },
        });

      await clickUnpublishPlugin(sidekick);

      expect(showModalSpy.calledWithMatch({ type: MODALS.DELETE })).to.be.true;

      confirmUnpublish(sidekick);

      await waitUntil(() => unpublishStub.calledOnce);

      waitUntil(() => showToastSpy.calledOnce);

      await waitUntil(() => reloadPageStub.calledOnce, 'page not reloaded', { timeout: 4000 });

      expect(unpublishStub.calledOnce).to.be.true;
      expect(reloadPageStub.calledOnce).to.be.true;
      expect(sidekickTest.rumStub.calledWith('click', {
        source: 'sidekick',
        target: 'unpublished',
      })).to.be.true;
    }).timeout(5000);

    it('asks for user confirmation and skips reloading page if toast closed', async () => {
      sidekickTest
        .mockFetchStatusSuccess(false, {
          webPath: '/foo',
          // live delete permission is granted
          live: {
            status: 200,
            permissions: ['read', 'write', 'delete'],
          },
        });

      await clickUnpublishPlugin(sidekick);

      expect(showModalSpy.calledWithMatch({ type: MODALS.DELETE })).to.be.true;

      confirmUnpublish(sidekick);

      await waitUntil(() => unpublishStub.calledOnce);

      waitUntil(() => showToastSpy.calledOnce);
      sidekickTest.clickToastClose();

      expect(unpublishStub.calledOnce).to.be.true;
      expect(reloadPageStub.calledOnce).to.be.false;
      expect(sidekickTest.rumStub.calledWith('click', {
        source: 'sidekick',
        target: 'unpublished',
      })).to.be.true;
    }).timeout(5000);

    it('allows authenticated user to unpublish even if source file still exists', async () => {
      sidekickTest
        .mockFetchStatusSuccess(false, {
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

      await waitUntil(() => unpublishStub.calledOnce);

      expect(sidekickTest.rumStub.calledWith('click', {
        source: 'sidekick',
        target: 'unpublished',
      })).to.be.true;
    });

    it('handles server failure', async () => {
      sidekickTest
        .mockFetchStatusSuccess(false, {
          // live delete permission is granted
          live: {
            status: 200,
            permissions: ['read', 'write', 'delete'],
          },
        });

      unpublishStub.resolves(false);

      await clickUnpublishPlugin(sidekick);

      expect(showModalSpy.calledWithMatch({ type: MODALS.DELETE })).to.be.true;

      confirmUnpublish(sidekick);

      await waitUntil(() => unpublishStub.calledOnce);
      expect(unpublishStub.calledOnce);
    }).timeout(5000);
  });
});
