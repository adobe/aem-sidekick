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
import { AEMSidekick } from '../../../../../src/extension/app/aem-sidekick.js';
import { mockFetchEnglishMessagesSuccess } from '../../../fixtures/i18n.js';
import { defaultSidekickConfig } from '../../../fixtures/stubs/sidekick-config.js';
import {
  mockEditorFetchStatusSuccess,
  mockFetchConfigWithPluginsJSONSuccess,
} from '../../../fixtures/helix-admin.js';
import '../../../../../src/extension/index.js';
import { mockEnvironment, restoreEnvironment } from '../../../mocks/environment.js';

// @ts-ignore
window.chrome = chromeMock;

describe('Palette container', () => {
  let sidekick;
  beforeEach(async () => {
    mockFetchEnglishMessagesSuccess();
  });

  afterEach(() => {
    document.body.removeChild(sidekick);
    restoreEnvironment(document);
  });

  async function openPallete(plugin = 'tag-selector') {
    sidekick = new AEMSidekick(defaultSidekickConfig);
    document.body.appendChild(sidekick);

    await waitUntil(() => recursiveQuery(sidekick, 'action-bar-picker'));

    const toolsPlugin = recursiveQuery(sidekick, 'action-bar-picker.tools');
    const plugins = recursiveQueryAll(toolsPlugin, 'sp-menu-item');

    const tagSelectorPlugin = plugins.values().next().value;
    expect(tagSelectorPlugin).to.exist;
    expect(tagSelectorPlugin.textContent).to.equal('Tag Selector');

    toolsPlugin.value = plugin;
    toolsPlugin.dispatchEvent(new Event('change'));

    // Picker label should not change on selection
    const toolsPickerPluginLabel = recursiveQuery(toolsPlugin, '#label');
    expect(toolsPickerPluginLabel.textContent.trim()).to.equal('Tools');

    await waitUntil(() => recursiveQuery(sidekick, 'palette-dialog'));
  }

  it('closes palette plugin via close button', async () => {
    mockEditorFetchStatusSuccess();
    mockFetchConfigWithPluginsJSONSuccess();
    mockEnvironment(document, 'editor');

    await openPallete();

    const paletteContainer = recursiveQuery(sidekick, 'palette-container');
    const paletteDialog = recursiveQuery(sidekick, 'palette-dialog');
    const closeButton = recursiveQuery(paletteDialog, 'sp-close-button');
    closeButton.dispatchEvent(new Event('click'));

    await waitUntil(() => paletteContainer.plugin === undefined);

    expect(paletteContainer.plugin).to.be.undefined;
  });

  it('closes palette plugin via esc key', async () => {
    mockEditorFetchStatusSuccess();
    mockFetchConfigWithPluginsJSONSuccess();
    mockEnvironment(document, 'editor');

    await openPallete();

    const paletteContainer = recursiveQuery(sidekick, 'palette-container');

    paletteContainer.dispatchEvent(new KeyboardEvent('keydown', { key: 'QKey' }));
    expect(paletteContainer.plugin).to.exist;

    paletteContainer.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    await waitUntil(() => paletteContainer.plugin === undefined);

    expect(paletteContainer.plugin).to.be.undefined;
  });

  it('palette renders titleI18n', async () => {
    mockEditorFetchStatusSuccess();
    mockFetchConfigWithPluginsJSONSuccess();
    mockEnvironment(document, 'editor');

    await openPallete('localize');

    const paletteContainer = recursiveQuery(sidekick, 'palette-container');
    const title = recursiveQuery(paletteContainer, 'h2');

    expect(title.textContent.trim()).to.equal('Localize project');
  });
});
