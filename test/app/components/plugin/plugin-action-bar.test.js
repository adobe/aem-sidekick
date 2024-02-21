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
import { AEMSidekick } from '../../../../src/extension/app/aem-sidekick.js';
import { mockFetchEnglishMessagesSuccess } from '../../../mocks/i18n.js';
import { defaultSidekickConfig } from '../../../fixtures/sidekick-config.js';
import {
  mockSharepointDirectoryFetchStatusSuccess,
  mockSharepointEditorDocFetchStatusSuccess,
  mockFetchConfigJSONNotFound,
  mockFetchConfigWithPluginsJSONSuccess,
  mockFetchConfigWithoutPluginsJSONSuccess,
  mockFetchStatusSuccess,
  mockFetchConfigWithoutPluginsOrHostJSONSuccess,
} from '../../../mocks/helix-admin.js';
import '../../../../src/extension/index.js';
import {
  mockHelixEnvironment,
  mockEditorAdminEnvironment,
  mockLocation,
  restoreEnvironment,
} from '../../../mocks/environment.js';
import { EXTERNAL_EVENTS } from '../../../../src/extension/app/constants.js';
import { pluginFactory } from '../../../../src/extension/app/plugins/plugin-factory.js';

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
      expect(envButton, `Button for ${env} does not exist`).to.exist;
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
    it('isPreview', async () => {
      mockFetchStatusSuccess();
      mockFetchConfigWithoutPluginsOrHostJSONSuccess();
      mockHelixEnvironment(document, 'preview');

      sidekick = new AEMSidekick(defaultSidekickConfig);
      document.body.appendChild(sidekick);

      await waitUntil(() => recursiveQuery(sidekick, 'action-bar-picker'));
      expectPluginCount(3);

      expectEnvPlugin(['preview', 'edit', 'live']);

      expectPlugin('env-switcher');
      expectPlugin('.reload');
      expectPlugin('.publish');
    });

    it('editor - w/custom plugins', async () => {
      mockFetchStatusSuccess();
      mockFetchConfigWithPluginsJSONSuccess();
      mockSharepointEditorDocFetchStatusSuccess();
      mockEditorAdminEnvironment(document, 'editor');

      sidekick = new AEMSidekick(defaultSidekickConfig);
      document.body.appendChild(sidekick);

      await waitUntil(() => recursiveQuery(sidekick, 'action-bar-picker'));

      expectPluginCount(5);

      expectEnvPlugin(['edit', 'preview', 'prod']);

      expectPlugin('env-switcher');
      expectPlugin('.edit-preview');
      expectPlugin('.asset-library');
      expectPlugin('.library');
      expectPlugin('.tools');

      // Should fallback to id for label if title not provided
      const assetLibraryPlugin = recursiveQuery(sidekick, '.asset-library');
      expect(assetLibraryPlugin.textContent.trim()).to.equal('asset-library');
    });

    it('isLive', async () => {
      mockFetchStatusSuccess();
      mockFetchConfigJSONNotFound();
      mockHelixEnvironment(document, 'live');

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
      mockHelixEnvironment(document, 'prod');

      sidekick = new AEMSidekick(defaultSidekickConfig);
      document.body.appendChild(sidekick);

      await waitUntil(() => recursiveQuery(sidekick, 'action-bar-picker'));

      expectPluginCount(2);

      expectEnvPlugin(['prod', 'preview', 'edit']);

      expectPlugin('env-switcher');
      expectPlugin('.publish');
    });

    it('Unsupported env', async () => {
      mockFetchStatusSuccess();
      mockFetchConfigJSONNotFound();
      mockLocation(document, 'https://www.example.com');

      sidekick = new AEMSidekick(defaultSidekickConfig);
      document.body.appendChild(sidekick);

      await waitUntil(() => recursiveQuery(sidekick, 'action-bar-picker'));

      expectPluginCount(1);

      expectEnvPlugin([]);

      expectPlugin('env-switcher');
    });

    it('isEditor', async () => {
      mockSharepointEditorDocFetchStatusSuccess();
      mockFetchConfigJSONNotFound();
      mockEditorAdminEnvironment(document, 'editor');

      sidekick = new AEMSidekick(defaultSidekickConfig);
      document.body.appendChild(sidekick);

      sidekick.appendChild(document.createElement('div'));

      await waitUntil(() => recursiveQuery(sidekick, 'action-bar-picker'));

      expectPluginCount(2);

      expectEnvPlugin(['edit', 'preview', 'live']);

      expectPlugin('env-switcher');
      expectPlugin('.edit-preview');
    });

    it('isEditor - custom config with prod host', async () => {
      mockSharepointEditorDocFetchStatusSuccess();
      mockFetchConfigWithoutPluginsJSONSuccess();
      mockEditorAdminEnvironment(document, 'editor');

      sidekick = new AEMSidekick(defaultSidekickConfig);
      document.body.appendChild(sidekick);

      sidekick.appendChild(document.createElement('div'));

      await waitUntil(() => recursiveQuery(sidekick, 'action-bar-picker'));

      expectPluginCount(2);

      expectEnvPlugin(['edit', 'preview', 'prod']);

      expectPlugin('env-switcher');
      expectPlugin('.edit-preview');
    });

    it('isPreview - custom config with prod host', async () => {
      mockFetchStatusSuccess();
      mockFetchConfigWithoutPluginsJSONSuccess();
      mockHelixEnvironment(document, 'preview');

      sidekick = new AEMSidekick(defaultSidekickConfig);
      document.body.appendChild(sidekick);

      sidekick.appendChild(document.createElement('div'));

      await waitUntil(() => recursiveQuery(sidekick, 'action-bar-picker'));

      expectPluginCount(3);
      expectEnvPlugin(['preview', 'edit', 'prod']);
      expectPlugin('env-switcher');
      expectPlugin('.publish');
    });

    it('core plugin clicked', async () => {
      window.hlx = {};

      const actionFunction = async () => {};

      // Create a spy for the action function
      const actionSpy = sinon.spy(actionFunction);

      const stub = sinon.stub(pluginFactory, 'createPublishPlugin').returns({
        id: 'publish',
        condition: () => true,
        button: {
          text: 'Publish',
          action: actionSpy,
        },
      });

      mockFetchStatusSuccess();
      mockFetchConfigWithoutPluginsJSONSuccess();
      mockHelixEnvironment(document, 'preview');

      sidekick = new AEMSidekick(defaultSidekickConfig);
      document.body.appendChild(sidekick);

      sidekick.appendChild(document.createElement('div'));

      await waitUntil(() => recursiveQuery(sidekick, 'action-bar-picker'));

      expectPluginCount(3);

      const publishButton = recursiveQuery(sidekick, '.publish');
      publishButton.click();

      expect(actionSpy.calledOnce).to.be.true;

      stub.restore();
    });

    it('isAdmin - loads correct plugins', async () => {
      mockSharepointEditorDocFetchStatusSuccess();
      mockFetchConfigJSONNotFound();
      mockEditorAdminEnvironment(document, 'admin');

      sidekick = new AEMSidekick(defaultSidekickConfig);
      document.body.appendChild(sidekick);

      // TODO: Expand tests when bulk plugin is added
      // expectPluginCount(0);
    });

    it('custom container plugin', async () => {
      mockSharepointEditorDocFetchStatusSuccess();
      mockSharepointDirectoryFetchStatusSuccess();
      mockFetchConfigWithPluginsJSONSuccess();
      mockEditorAdminEnvironment(document, 'editor');

      sidekick = new AEMSidekick(defaultSidekickConfig);
      document.body.appendChild(sidekick);

      await waitUntil(() => recursiveQuery(sidekick, 'action-bar-picker'));

      expectPluginCount(5);
      expectPlugin('.tools');

      const toolsPlugin = recursiveQuery(sidekick, 'action-bar-picker.tools');
      const plugins = recursiveQueryAll(toolsPlugin, 'sp-menu-item');

      expect([...plugins].length).to.equal(2);
      expect(plugins.values().next().value.textContent).to.equal('Tag Selector');
    });

    it('clicks custom plugin', async () => {
      mockSharepointEditorDocFetchStatusSuccess();
      mockSharepointDirectoryFetchStatusSuccess();
      mockFetchConfigWithPluginsJSONSuccess();
      mockEditorAdminEnvironment(document, 'editor');

      const openStub = sinon.stub(window, 'open');
      const pluginUsedEventSpy = sinon.spy();

      sidekick = new AEMSidekick(defaultSidekickConfig);
      document.body.appendChild(sidekick);

      sidekick.addEventListener(EXTERNAL_EVENTS.PLUGIN_USED, pluginUsedEventSpy);

      await waitUntil(() => recursiveQuery(sidekick, 'action-bar-picker'));

      expectPluginCount(5);

      const libraryPlugin = recursiveQuery(sidekick, '.library');
      libraryPlugin.click();

      expect(openStub.calledOnce).to.be.true;
      expect(pluginUsedEventSpy.calledOnce).to.be.true;

      openStub.restore();
    });
  });
});
