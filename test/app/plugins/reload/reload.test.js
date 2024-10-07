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

import { aTimeout, expect, waitUntil } from '@open-wc/testing';
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

describe('Reload plugin', () => {
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

  let reloaded = false;
  let showToastSpy;

  beforeEach(async () => {
    appStore = new AppStore();
    sidekickTest = new SidekickTest(defaultSidekickConfig, appStore);
    sidekickTest
      .mockFetchSidekickConfigSuccess(false, false)
      .mockFetchStatusSuccess()
      .mockHelixEnvironment(HelixMockEnvironments.PREVIEW);

    sidekick = sidekickTest.createSidekick();
    showToastSpy = sidekickTest.sandbox.spy(appStore, 'showToast');
    sidekickTest.sandbox.stub(appStore, 'reloadPage').callsFake(() => {
      reloaded = true;
    });

    reloaded = false;
  });

  afterEach(() => {
    sidekickTest.destroy();
  });

  it('reload calls appStore.update() and reloads window', async () => {
    const { sandbox } = sidekickTest;
    const updateStub = sandbox.stub(appStore, 'update')
      .resolves(true);

    await sidekickTest.awaitEnvSwitcher();

    const reloadPlugin = recursiveQuery(sidekick, '.reload');
    expect(reloadPlugin.textContent.trim()).to.equal('Update');
    await waitUntil(() => reloadPlugin.getAttribute('disabled') === null);

    reloadPlugin.click();

    await aTimeout(500);

    await waitUntil(() => updateStub.calledOnce);

    expect(updateStub.calledOnce).to.be.true;
    expect(reloaded).to.be.true;

    expect(showToastSpy.calledWith({
      message: 'Preview successfully updated, reloading...',
      variant: 'positive',
    })).to.be.true;
    expect(sidekickTest.rumStub.calledWith('click', {
      source: 'sidekick',
      target: 'updated',
    })).to.be.true;
  });

  it('reload handles failure', async () => {
    const { sandbox } = sidekickTest;
    const updateStub = sandbox.stub(appStore, 'update')
      .resolves(false);

    await sidekickTest.awaitEnvSwitcher();

    const reloadPlugin = recursiveQuery(sidekick, '.reload');

    reloadPlugin.click();

    await waitUntil(() => updateStub.calledOnce);

    expect(updateStub.calledOnce).to.be.true;
    expect(reloaded).to.be.false;
  });
});
