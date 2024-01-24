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
import fetchMock from 'fetch-mock/esm/client.js';
import { expect, waitUntil } from '@open-wc/testing';
import sinon from 'sinon';
import { recursiveQuery, recursiveQueryAll } from '../../../test-utils.js';
import chromeMock from '../../../mocks/chrome.js';
import { AEMSidekick } from '../../../../../src/extension/app/aem-sidekick.js';
import { mockFetchEnglishMessagesSuccess } from '../../../fixtures/i18n.js';
import { defaultSidekickConfig } from '../../../fixtures/stubs/sidekick-config.js';
import {
  mockDirectoryFetchStatusSuccess,
  mockEditorFetchStatusSuccess,
  mockFetchConfigJSONNotFound,
  mockFetchConfigWithPluginsJSONSuccess,
  mockFetchConfigWithoutPluginsJSONSuccess,
  mockFetchStatusSuccess,
} from '../../../fixtures/helix-admin.js';
import '../../../../../src/extension/index.js';
import { mockEnvironment, restoreEnvironment } from '../../../mocks/environment.js';
import { EXTERNAL_EVENTS } from '../../../../../src/extension/app/constants.js';

// @ts-ignore
window.chrome = chromeMock;

describe('Plugin action bar', () => {
  let sidekick;
  beforeEach(async () => {
    mockFetchEnglishMessagesSuccess();
  });

  afterEach(() => {
    document.body.removeChild(sidekick);
    fetchMock.reset();
    restoreEnvironment(document);
  });

  function expectEnvPlugin(environments) {
    const actionBar = recursiveQuery(sidekick, 'action-bar');
    const envPlugin = recursiveQuery(actionBar, 'env-switcher');
    const picker = recursiveQuery(envPlugin, 'action-bar-picker');

    expect(envPlugin).to.exist;

    environments.forEach((env) => {
      const envButton = recursiveQuery(picker, `sp-menu-item.env-${env}`);
      expect(envButton).to.exist;
    });

    const menuButtons = recursiveQueryAll(picker, 'sp-menu-item');
    expect([...menuButtons].length).to.equal(environments.length);
  }

  function expectPlugin(selector) {
    const actionBar = recursiveQuery(sidekick, 'action-bar');
    const plugin = recursiveQuery(actionBar, selector);
    expect(plugin).to.exist;
  }

  function expectPluginCount(count) {
    const actionGroup = recursiveQuery(sidekick, 'sp-action-group:first-of-type');
    const plugins = recursiveQueryAll(actionGroup, 'sp-action-button, env-switcher, action-bar-picker');

    expect([...plugins].length).to.equal(count);
  }

  describe('renders correct default plugins in action bar', () => {
    it('isInner', async () => {
      mockFetchStatusSuccess();
      mockFetchConfigJSONNotFound();
      mockEnvironment(document, 'inner');

      sidekick = new AEMSidekick(defaultSidekickConfig);
      document.body.appendChild(sidekick);

      await waitUntil(() => recursiveQuery(sidekick, 'action-bar-picker'));

      expectPluginCount(2);

      expectEnvPlugin(['preview', 'edit', 'live']);

      expectPlugin('env-switcher');
      expectPlugin('.publish');
    });

    it('isInner - w/custom plugins', async () => {
      mockFetchStatusSuccess();
      mockFetchConfigWithPluginsJSONSuccess();
      mockEnvironment(document, 'editor');

      sidekick = new AEMSidekick(defaultSidekickConfig);
      document.body.appendChild(sidekick);

      await waitUntil(() => recursiveQuery(sidekick, 'action-bar-picker'));

      expectPluginCount(5);

      expectEnvPlugin(['preview', 'live']);

      expectPlugin('env-switcher');
      expectPlugin('.edit-preview');
      expectPlugin('.asset-library');
      expectPlugin('.library');
      expectPlugin('.tools');

      // Should fallback to id for label if title not provided
      const assetLibraryPlugin = recursiveQuery(sidekick, '.asset-library');
      expect(assetLibraryPlugin.textContent.trim()).to.equal('asset-library');
    });

    it('isOuter', async () => {
      mockFetchStatusSuccess();
      mockFetchConfigJSONNotFound();
      mockEnvironment(document, 'outer');

      sidekick = new AEMSidekick(defaultSidekickConfig);
      document.body.appendChild(sidekick);

      await waitUntil(() => recursiveQuery(sidekick, 'action-bar-picker'));

      expectPluginCount(2);

      expectEnvPlugin(['preview', 'edit', 'live']);

      expectPlugin('env-switcher');
      expectPlugin('.publish');
    });

    it('isProd', async () => {
      mockFetchStatusSuccess();
      mockFetchConfigJSONNotFound();
      mockEnvironment(document, 'prod');

      sidekick = new AEMSidekick(defaultSidekickConfig);
      document.body.appendChild(sidekick);

      await waitUntil(() => recursiveQuery(sidekick, 'action-bar-picker'));

      expectPluginCount(2);

      expectEnvPlugin(['prod', 'preview', 'edit', 'live']);

      expectPlugin('env-switcher');
      expectPlugin('.publish');
    });

    it('isEditor', async () => {
      mockEditorFetchStatusSuccess();
      mockFetchConfigJSONNotFound();
      mockEnvironment(document, 'editor');

      sidekick = new AEMSidekick(defaultSidekickConfig);
      document.body.appendChild(sidekick);

      sidekick.appendChild(document.createElement('div'));

      await waitUntil(() => recursiveQuery(sidekick, 'action-bar-picker'));

      expectPluginCount(2);

      expectEnvPlugin(['preview', 'live']);

      expectPlugin('env-switcher');
      expectPlugin('.edit-preview');
    });

    it('isEditor - custom config with prod host', async () => {
      mockEditorFetchStatusSuccess();
      mockFetchConfigWithoutPluginsJSONSuccess();
      mockEnvironment(document, 'editor');

      sidekick = new AEMSidekick(defaultSidekickConfig);
      document.body.appendChild(sidekick);

      sidekick.appendChild(document.createElement('div'));

      await waitUntil(() => recursiveQuery(sidekick, 'action-bar-picker'));

      expectPluginCount(2);

      expectEnvPlugin(['preview', 'live', 'prod']);

      expectPlugin('env-switcher');
      expectPlugin('.edit-preview');
    });

    it('isInner - custom config with prod host', async () => {
      mockFetchStatusSuccess();
      mockFetchConfigWithoutPluginsJSONSuccess();
      mockEnvironment(document, 'inner');

      sidekick = new AEMSidekick(defaultSidekickConfig);
      document.body.appendChild(sidekick);

      sidekick.appendChild(document.createElement('div'));

      await waitUntil(() => recursiveQuery(sidekick, 'action-bar-picker'));

      expectPluginCount(2);
      expectEnvPlugin(['preview', 'edit', 'live', 'prod']);
      expectPlugin('env-switcher');
      expectPlugin('.publish');
    });

    it('core plugin clicked', async () => {
      mockFetchStatusSuccess();
      mockFetchConfigWithoutPluginsJSONSuccess();
      mockEnvironment(document, 'inner');

      sidekick = new AEMSidekick(defaultSidekickConfig);
      document.body.appendChild(sidekick);

      sidekick.appendChild(document.createElement('div'));

      await waitUntil(() => recursiveQuery(sidekick, 'action-bar-picker'));

      expectPluginCount(2);

      const publishButton = recursiveQuery(sidekick, '.publish');
      publishButton.dispatchEvent(new Event('click'));
      await waitUntil(() => recursiveQuery(sidekick, 'dialog-view'));

      const dialogView = recursiveQuery(sidekick, 'dialog-view');
      expect(dialogView).to.exist;
    });

    it('isAdmin', async () => {
      mockDirectoryFetchStatusSuccess();
      mockFetchConfigJSONNotFound();
      mockEnvironment(document, 'admin');

      sidekick = new AEMSidekick(defaultSidekickConfig);
      document.body.appendChild(sidekick);

      await waitUntil(() => recursiveQuery(sidekick, 'action-bar-picker'));

      // TODO: Expand tests when bulk plugin is added
      expectPluginCount(1);

      expectEnvPlugin([]);

      expectPlugin('env-switcher');
    });

    it('custom container plugin', async () => {
      mockEditorFetchStatusSuccess();
      mockFetchConfigWithPluginsJSONSuccess();
      mockEnvironment(document, 'editor');

      sidekick = new AEMSidekick(defaultSidekickConfig);
      document.body.appendChild(sidekick);

      await waitUntil(() => recursiveQuery(sidekick, 'action-bar-picker'));

      expectPluginCount(5);
      expectPlugin('.tools');

      const toolsPlugin = recursiveQuery(sidekick, 'action-bar-picker.tools');
      const plugins = recursiveQueryAll(toolsPlugin, 'sp-menu-item');

      expect([...plugins].length).to.equal(1);
      expect(plugins.values().next().value.textContent).to.equal('Tag Selector');
    });

    it('clicks custom plugin', async () => {
      mockEditorFetchStatusSuccess();
      mockFetchConfigWithPluginsJSONSuccess();
      mockEnvironment(document, 'editor');

      const openStub = sinon.stub(window, 'open');
      const pluginUsedEventSpy = sinon.spy();

      sidekick = new AEMSidekick(defaultSidekickConfig);
      document.body.appendChild(sidekick);

      sidekick.addEventListener(EXTERNAL_EVENTS.PLUGIN_USED, pluginUsedEventSpy);

      await waitUntil(() => recursiveQuery(sidekick, 'action-bar-picker'));

      expectPluginCount(5);

      const libraryPlugin = recursiveQuery(sidekick, '.library');
      libraryPlugin.dispatchEvent(new Event('click'));

      expect(openStub.calledOnce).to.be.true;
      expect(pluginUsedEventSpy.calledOnce).to.be.true;

      openStub.restore();
    });

    it('opens palette plugin', async () => {
      mockEditorFetchStatusSuccess();
      mockFetchConfigWithPluginsJSONSuccess();
      mockEnvironment(document, 'editor');

      sidekick = new AEMSidekick(defaultSidekickConfig);
      document.body.appendChild(sidekick);

      await waitUntil(() => recursiveQuery(sidekick, 'action-bar-picker'));

      expectPluginCount(5);
      expectPlugin('.tools');

      const toolsPlugin = recursiveQuery(sidekick, 'action-bar-picker.tools');
      const plugins = recursiveQueryAll(toolsPlugin, 'sp-menu-item');

      expect([...plugins].length).to.equal(1);

      const tagSelectorPlugin = plugins.values().next().value;
      expect(tagSelectorPlugin).to.exist;
      expect(tagSelectorPlugin.textContent).to.equal('Tag Selector');

      toolsPlugin.value = 'tag-selector';
      toolsPlugin.dispatchEvent(new Event('change'));

      // Picker label should not change on selection
      const toolsPickerPluginLabel = recursiveQuery(toolsPlugin, '#label');
      expect(toolsPickerPluginLabel.textContent.trim()).to.equal('Tools');

      await waitUntil(() => recursiveQuery(sidekick, 'palette-dialog'));

      const paletteDialog = recursiveQuery(sidekick, 'palette-dialog');
      expect(paletteDialog).to.exist;
    });
  });
});
