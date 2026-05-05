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

describe('Edit plugin', () => {
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

  let switchEnvStub;

  beforeEach(async () => {
    appStore = new AppStore();
    sidekickTest = new SidekickTest(defaultSidekickConfig, appStore);
    sidekickTest
      .mockFetchSidekickConfigSuccess(false, false)
      .mockFetchStatusSuccess()
      .mockHelixEnvironment(HelixMockEnvironments.PREVIEW);

    sidekick = sidekickTest.createSidekick();
    switchEnvStub = sidekickTest.sandbox.spy(appStore, 'switchEnv');
  });

  afterEach(() => {
    sidekickTest.destroy();
  });

  it('switches to editor environment', async () => {
    await sidekickTest.awaitEnvSwitcher();

    const editPlugin = recursiveQuery(sidekick, '.edit');
    expect(editPlugin.textContent.trim()).to.equal('Edit');

    editPlugin.click();

    await waitUntil(() => switchEnvStub.calledOnce);

    expect(switchEnvStub.calledWith('edit', true)).to.be.true;
  });

  it('renders as button when collabMode is false', async () => {
    await sidekickTest.awaitEnvSwitcher();

    const editButton = recursiveQuery(sidekick, 'sp-action-button.edit');
    expect(editButton).to.exist;

    const editPicker = recursiveQuery(sidekick, 'action-bar-picker.edit');
    expect(editPicker).to.not.exist;
  });

  it('renders as dropdown when collabMode is true', async () => {
    appStore.collabMode = true;
    await sidekickTest.awaitEnvSwitcher();

    const editPicker = recursiveQuery(sidekick, 'action-bar-picker.edit');
    expect(editPicker).to.exist;

    const menuItems = editPicker.querySelectorAll('sk-menu-item');
    expect(menuItems.length).to.equal(2);
    expect(menuItems[0].getAttribute('value')).to.equal('secondary-action');
    expect(menuItems[1].getAttribute('value')).to.equal('default-action');
  });

  it('default action opens editor when collabMode is true', async () => {
    appStore.collabMode = true;
    await sidekickTest.awaitEnvSwitcher();

    const editPicker = recursiveQuery(sidekick, 'action-bar-picker.edit');
    editPicker.value = 'default-action';
    editPicker.dispatchEvent(new Event('change'));

    await waitUntil(() => switchEnvStub.calledOnce);

    expect(switchEnvStub.calledWith('edit', true)).to.be.true;
  });

  it('secondary action enables inline editing', async () => {
    appStore.collabMode = true;
    appStore.showToast = sidekickTest.sandbox.stub();
    await sidekickTest.awaitEnvSwitcher();

    const editPicker = recursiveQuery(sidekick, 'action-bar-picker.edit');
    editPicker.value = 'secondary-action';
    editPicker.dispatchEvent(new Event('change'));

    await waitUntil(() => appStore.inlineEditingMode);

    expect(appStore.inlineEditingMode).to.be.true;
  });
});
