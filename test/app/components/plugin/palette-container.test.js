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

// @ts-ignore
import { expect, waitUntil } from '@open-wc/testing';
import { recursiveQuery, recursiveQueryAll } from '../../../test-utils.js';
import chromeMock from '../../../mocks/chrome.js';
import { defaultSidekickConfig } from '../../../fixtures/sidekick-config.js';
import '../../../../src/extension/index.js';
import { AppStore } from '../../../../src/extension/app/store/app.js';
import { SidekickTest } from '../../../sidekick-test.js';

/**
 * The AEMSidekick object type
 * @typedef {import('../../../../src/extension/app/aem-sidekick.js').AEMSidekick} AEMSidekick
 */

// @ts-ignore
window.chrome = chromeMock;

describe('Palette container', () => {
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
      .mockFetchEditorStatusSuccess()
      .mockFetchSidekickConfigSuccess(true, true)
      .mockEditorAdminEnvironment();
  });

  afterEach(() => {
    sidekickTest.destroy();
  });

  async function openPallete(plugin = 'tag-selector') {
    sidekick = sidekickTest.createSidekick();

    await waitUntil(() => recursiveQuery(sidekick, 'action-bar-picker'));

    const toolsPlugin = recursiveQuery(sidekick, 'action-bar-picker.tools');
    const plugins = recursiveQueryAll(toolsPlugin, 'sk-menu-item');

    const tagSelectorPlugin = plugins.values().next().value;
    expect(tagSelectorPlugin).to.exist;
    expect(tagSelectorPlugin.textContent).to.equal('Tag Selector');

    toolsPlugin.value = plugin;
    toolsPlugin.dispatchEvent(new Event('change'));

    // Picker label should not change on selection
    const toolsPickerPluginLabel = recursiveQuery(toolsPlugin, '#label');
    expect(toolsPickerPluginLabel.textContent.trim()).to.equal('Tools');

    await waitUntil(() => recursiveQuery(sidekick, 'palette-container'));
  }

  it('closes palette plugin via close button', async () => {
    await openPallete();

    const paletteContainer = recursiveQuery(sidekick, 'palette-container');
    await waitUntil(() => recursiveQuery(paletteContainer, 'sk-action-button'));

    expect(sidekickTest.rumStub.calledWith('click', {
      source: 'sidekick',
      target: 'palette-opened',
    })).to.be.true;

    const closeButton = recursiveQuery(paletteContainer, 'sk-action-button');
    closeButton.click();

    const container = recursiveQuery(paletteContainer, '.container');
    await waitUntil(() => container.classList.contains('hidden'));
    expect(container.classList.contains('hidden')).to.be.true;
    expect(sidekickTest.rumStub.calledWith('click', {
      source: 'sidekick',
      target: 'palette-closed',
    })).to.be.true;
  }).timeout(20000);

  it('closes palette plugin via esc key', async () => {
    await openPallete();

    const paletteContainer = recursiveQuery(sidekick, 'palette-container');

    await waitUntil(() => recursiveQuery(paletteContainer, '.title'));
    paletteContainer.dispatchEvent(new KeyboardEvent('keydown', { key: 'QKey' }));
    expect(paletteContainer.plugin).to.exist;

    paletteContainer.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    const container = recursiveQuery(paletteContainer, '.container');
    await waitUntil(() => container.classList.contains('hidden'));
    expect(container.classList.contains('hidden')).to.be.true;
    expect(sidekickTest.rumStub.calledWith('click', {
      source: 'sidekick',
      target: 'palette-closed',
    })).to.be.true;
  });

  it('palette renders titleI18n', async () => {
    await openPallete('localize');

    const paletteContainer = recursiveQuery(sidekick, 'palette-container');
    await waitUntil(() => recursiveQuery(paletteContainer, '.title'));
    const title = recursiveQuery(paletteContainer, '.title');

    expect(title.textContent.trim()).to.equal('Localize project');
  });
});
