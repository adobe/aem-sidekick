/*
 * Copyright 2023 Adobe. All rights reserved.
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
  HelixMockEnvironments,
} from '../../../mocks/environment.js';
import { SidekickTest } from '../../../sidekick-test.js';

/**
 * The AEMSidekick object type
 * @typedef {import('../../../../src/extension/app/aem-sidekick.js').AEMSidekick} AEMSidekick
 */

// @ts-ignore
window.chrome = chromeMock;

describe('Publish plugin', () => {
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

  beforeEach(async () => {
    appStore = new AppStore();
    sidekickTest = new SidekickTest(defaultSidekickConfig, appStore);
    sidekickTest
      .mockFetchStatusSuccess()
      .mockHelixEnvironment(HelixMockEnvironments.PREVIEW);
  });

  afterEach(() => {
    sidekickTest.destroy();
  });

  describe('switching between environments', () => {
    it('publish from preview - docx with toast timeout', async () => {
      const { sandbox } = sidekickTest;
      sidekickTest
        .mockFetchSidekickConfigSuccess(false, false);

      const publishStub = sandbox.stub(appStore, 'publish').resolves(true);
      const switchEnvStub = sandbox.stub(appStore, 'switchEnv').resolves();
      const showToastSpy = sandbox.spy(appStore, 'showToast');

      sidekick = sidekickTest.createSidekick();

      await sidekickTest.awaitEnvSwitcher();

      const publishPlugin = recursiveQuery(sidekick, '.publish');
      expect(publishPlugin.textContent.trim()).to.equal('Publish');
      await waitUntil(() => publishPlugin.getAttribute('disabled') === null);
      publishPlugin.click();

      await waitUntil(() => publishStub.calledOnce);
      await waitUntil(() => switchEnvStub.calledOnce, 'switchEnv was not called', { timeout: 5000 });

      expect(showToastSpy.calledWith('Publication successful, opening Live...', 'positive')).to.be.true;
    }).timeout(15000);

    it('publish from preview - docx with toast dismiss', async () => {
      const { sandbox } = sidekickTest;
      sidekickTest
        .mockFetchSidekickConfigSuccess(false, false);

      const publishStub = sandbox.stub(appStore, 'publish').resolves(true);
      const showToastSpy = sandbox.spy(appStore, 'showToast');
      const closeToastSpy = sandbox.spy(appStore, 'closeToast');

      sidekick = sidekickTest.createSidekick();

      await sidekickTest.awaitEnvSwitcher();

      const publishPlugin = recursiveQuery(sidekick, '.publish');
      expect(publishPlugin.textContent.trim()).to.equal('Publish');
      await waitUntil(() => publishPlugin.getAttribute('disabled') === null);
      publishPlugin.click();

      await waitUntil(() => publishStub.calledOnce);

      await sidekickTest.clickToastClose();

      await waitUntil(() => closeToastSpy.calledOnce, 'toast was not dismissed', { timeout: 5000 });
      expect(showToastSpy.calledWith('Publication successful, opening Live...', 'positive')).to.be.true;
    }).timeout(15000);

    it('publish from preview - docx with host and toast dismiss', async () => {
      const { sandbox } = sidekickTest;
      sidekickTest
        .mockFetchSidekickConfigSuccess(true, false);

      const publishStub = sandbox.stub(appStore, 'publish').resolves(true);
      const showToastSpy = sandbox.spy(appStore, 'showToast');
      const closeToastSpy = sandbox.spy(appStore, 'closeToast');

      sidekick = sidekickTest.createSidekick();

      await sidekickTest.awaitEnvSwitcher();

      const publishPlugin = recursiveQuery(sidekick, '.publish');
      expect(publishPlugin.textContent.trim()).to.equal('Publish');
      await waitUntil(() => publishPlugin.getAttribute('disabled') === null);
      publishPlugin.click();

      await waitUntil(() => publishStub.calledOnce);

      await sidekickTest.clickToastClose();

      await waitUntil(() => closeToastSpy.calledOnce, 'toast was not dismissed', { timeout: 5000 });
      expect(showToastSpy.calledWith('Publication successful, opening Production...', 'positive')).to.be.true;
    }).timeout(15000);
  });
});
