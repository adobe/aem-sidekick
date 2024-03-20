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
  mockFetchConfigJSONNotAuthorized,
  mockFetchStatusWithProfileSuccess,
  mockFetchStatusUnauthorized,
  mockFetchConfigWithPluginsJSONSuccess,
  mockFetchConfigWithoutPluginsJSONSuccess,
  mockFetchConfigWithUnpinnedPluginJSONSuccess,
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
import { appStore } from '../../../../src/extension/app/store/app.js';
import { SidekickPlugin } from '../../../../src/extension/app/components/plugin/plugin.js';

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

  function expectAllPlugins(pluginIds) {
    const actionGroup = recursiveQuery(sidekick, 'sp-action-group:first-of-type');
    const plugins = recursiveQueryAll(actionGroup, 'sp-action-button, env-switcher, action-bar-picker');

    expect(
      [...plugins].map((plugin) => plugin.className.replace('plugin-container ', '')
        || plugin.tagName.toLowerCase()),
    ).to.deep.equal(pluginIds);
  }

  describe('renders correct default plugins in action bar', () => {
    it('isPreview', async () => {
      mockFetchStatusSuccess();
      mockFetchConfigWithoutPluginsOrHostJSONSuccess();
      mockHelixEnvironment(document, 'preview');

      sidekick = new AEMSidekick(defaultSidekickConfig);
      document.body.appendChild(sidekick);

      await waitUntil(() => recursiveQuery(sidekick, 'action-bar-picker'));
      expectAllPlugins([
        'env-switcher',
        'reload',
        'delete',
        'publish',
        'unpublish',
      ]);

      expectEnvPlugin(['preview', 'edit', 'live']);
    });

    it('editor - w/custom plugins', async () => {
      mockFetchStatusSuccess();
      mockFetchConfigWithPluginsJSONSuccess();
      mockSharepointEditorDocFetchStatusSuccess();
      mockEditorAdminEnvironment(document, 'editor');

      sidekick = new AEMSidekick(defaultSidekickConfig);
      document.body.appendChild(sidekick);

      await waitUntil(() => recursiveQuery(sidekick, 'action-bar-picker'));

      expectAllPlugins([
        'env-switcher',
        'edit-preview',
        'asset-library',
        'library',
        'tools',
      ]);

      expectEnvPlugin(['edit', 'preview', 'prod']);

      // Should fallback to id for label if title not provided
      const assetLibraryPlugin = recursiveQuery(sidekick, '.asset-library');
      expect(assetLibraryPlugin.textContent.trim()).to.equal('asset-library');
    });

    it('editor - w/unpinned plugin', async () => {
      mockFetchStatusSuccess();
      mockFetchConfigWithUnpinnedPluginJSONSuccess();
      mockSharepointEditorDocFetchStatusSuccess();
      mockEditorAdminEnvironment(document, 'editor');

      sidekick = new AEMSidekick(defaultSidekickConfig);
      document.body.appendChild(sidekick);

      await waitUntil(() => recursiveQuery(sidekick, 'action-bar-picker'));

      expectAllPlugins([
        'env-switcher',
        'edit-preview',
      ]);

      expect(recursiveQuery(sidekick, '.custom-plugin-0')).to.equal(undefined);
    });

    it('isLive', async () => {
      mockFetchStatusSuccess();
      mockFetchConfigJSONNotFound();
      mockHelixEnvironment(document, 'live');

      sidekick = new AEMSidekick(defaultSidekickConfig);
      document.body.appendChild(sidekick);

      await waitUntil(() => recursiveQuery(sidekick, 'action-bar-picker'));

      expectAllPlugins([
        'env-switcher',
        'publish',
        'unpublish',
      ]);

      expectEnvPlugin(['preview', 'edit', 'live']);
    });

    it('isProd', async () => {
      mockFetchStatusSuccess();
      mockFetchConfigJSONNotFound();
      mockHelixEnvironment(document, 'prod');

      sidekick = new AEMSidekick(defaultSidekickConfig);
      document.body.appendChild(sidekick);

      await waitUntil(() => recursiveQuery(sidekick, 'action-bar-picker'));

      expectAllPlugins([
        'env-switcher',
        'publish',
        'unpublish',
      ]);

      expectEnvPlugin(['prod', 'preview', 'edit']);
    });

    it('Unsupported env', async () => {
      mockFetchStatusSuccess();
      mockFetchConfigJSONNotFound();
      mockLocation(document, 'https://www.example.com');

      sidekick = new AEMSidekick(defaultSidekickConfig);
      document.body.appendChild(sidekick);

      await waitUntil(() => recursiveQuery(sidekick, 'action-bar-picker'));

      expectAllPlugins([
        'env-switcher',
      ]);

      expectEnvPlugin([]);
    });

    it('isEditor', async () => {
      mockSharepointEditorDocFetchStatusSuccess();
      mockFetchConfigJSONNotFound();
      mockEditorAdminEnvironment(document, 'editor');

      sidekick = new AEMSidekick(defaultSidekickConfig);
      document.body.appendChild(sidekick);

      sidekick.appendChild(document.createElement('div'));

      await waitUntil(() => recursiveQuery(sidekick, 'action-bar-picker'));

      expectAllPlugins([
        'env-switcher',
        'edit-preview',
      ]);

      expectEnvPlugin(['edit', 'preview', 'live']);
    });

    it('isEditor - custom config with prod host', async () => {
      mockSharepointEditorDocFetchStatusSuccess();
      mockFetchConfigWithoutPluginsJSONSuccess();
      mockEditorAdminEnvironment(document, 'editor');

      sidekick = new AEMSidekick(defaultSidekickConfig);
      document.body.appendChild(sidekick);

      sidekick.appendChild(document.createElement('div'));

      await waitUntil(() => recursiveQuery(sidekick, 'action-bar-picker'));

      expectAllPlugins([
        'env-switcher',
        'edit-preview',
      ]);

      expectEnvPlugin(['edit', 'preview', 'prod']);
    });

    it('isPreview - custom config with prod host', async () => {
      mockFetchStatusSuccess();
      mockFetchConfigWithoutPluginsJSONSuccess();
      mockHelixEnvironment(document, 'preview');

      sidekick = new AEMSidekick(defaultSidekickConfig);
      document.body.appendChild(sidekick);

      sidekick.appendChild(document.createElement('div'));

      await waitUntil(() => recursiveQuery(sidekick, 'action-bar-picker'));

      expectAllPlugins([
        'env-switcher',
        'reload',
        'delete',
        'publish',
        'unpublish',
      ]);

      expectEnvPlugin(['preview', 'edit', 'prod']);
    });

    it('core plugin clicked', async () => {
      window.hlx = {};

      const actionFunction = async () => Promise.resolve();

      // Create a spy for the action function
      const actionSpy = sinon.spy(actionFunction);

      const stub = sinon.stub(pluginFactory, 'createPublishPlugin').returns(new SidekickPlugin({
        id: 'publish',
        condition: () => true,
        button: {
          text: 'Publish',
          action: actionSpy,
        },
        appStore,
      }));

      mockFetchStatusSuccess();
      mockFetchConfigWithoutPluginsJSONSuccess();
      mockHelixEnvironment(document, 'preview');

      sidekick = new AEMSidekick(defaultSidekickConfig);
      document.body.appendChild(sidekick);

      sidekick.appendChild(document.createElement('div'));

      await waitUntil(() => recursiveQuery(sidekick, 'action-bar-picker'));

      expectAllPlugins([
        'env-switcher',
        'reload',
        'delete',
        'publish',
        'unpublish',
      ]);

      const publishButton = recursiveQuery(sidekick, '.publish');
      publishButton.click();

      await waitUntil(() => actionSpy.calledOnce);
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

      expectAllPlugins([
        'env-switcher',
        'edit-preview',
        'asset-library',
        'library',
        'tools',
      ]);

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

      const validateStub = sinon.stub(appStore, 'validateSession').resolves();
      const openStub = sinon.stub(window, 'open');
      const pluginUsedEventSpy = sinon.spy();

      sidekick = new AEMSidekick(defaultSidekickConfig);
      document.body.appendChild(sidekick);

      sidekick.addEventListener(EXTERNAL_EVENTS.PLUGIN_USED, pluginUsedEventSpy);

      await waitUntil(() => recursiveQuery(sidekick, 'action-bar-picker'));

      expectAllPlugins([
        'env-switcher',
        'edit-preview',
        'asset-library',
        'library',
        'tools',
      ]);

      const libraryPlugin = recursiveQuery(sidekick, '.library');
      libraryPlugin.click();

      await waitUntil(() => openStub.calledOnce);
      expect(openStub.calledOnce).to.be.true;
      expect(pluginUsedEventSpy.calledOnce).to.be.true;

      openStub.restore();
      validateStub.restore();
    });
  });

  describe('login states', () => {
    it('not logged in, site has authentication enabled', async () => {
      mockFetchConfigJSONNotAuthorized();
      mockFetchStatusUnauthorized();
      mockHelixEnvironment(document, 'preview');

      sidekick = new AEMSidekick(defaultSidekickConfig);
      document.body.appendChild(sidekick);

      await waitUntil(() => recursiveQuery(sidekick, 'action-bar'));

      const actionBar = recursiveQuery(sidekick, 'action-bar');
      const actionGroup = recursiveQuery(actionBar, 'sp-action-group');
      expect(actionGroup.children.length).to.equal(3);

      const propertiesButton = recursiveQuery(actionGroup, '.properties');
      expect(propertiesButton).to.exist;

      const loginButton = recursiveQuery(actionGroup, 'login-button');
      expect(loginButton).to.exist;
      expect(loginButton.classList.length).to.equal(1);
      expect(loginButton.classList.contains('not-authorized')).to.be.true;

      const logo = recursiveQuery(actionGroup, 'svg');
      expect(logo).to.exist;
    });

    it('not logged in, site does not have authentication enabled', async () => {
      mockFetchConfigWithoutPluginsJSONSuccess();
      mockFetchStatusSuccess();
      mockHelixEnvironment(document, 'preview');

      sidekick = new AEMSidekick(defaultSidekickConfig);
      document.body.appendChild(sidekick);

      await waitUntil(() => recursiveQuery(sidekick, 'action-bar'));

      const actionBar = recursiveQuery(sidekick, 'action-bar');
      const actionGroups = recursiveQueryAll(actionBar, 'sp-action-group');
      const actionGroupsArray = [...actionGroups];
      expect(actionGroupsArray.length).to.equal(2);

      const systemActionGroup = actionGroupsArray[1];

      const propertiesButton = recursiveQuery(systemActionGroup, '.properties');
      expect(propertiesButton).to.exist;

      const loginButton = recursiveQuery(systemActionGroup, 'login-button');
      expect(loginButton).to.exist;
      expect(loginButton.classList.length).to.equal(2);
      expect(loginButton.classList.contains('not-authorized')).to.be.true;
      expect(loginButton.classList.contains('no-login')).to.be.true;

      const logo = recursiveQuery(systemActionGroup, 'svg');
      expect(logo).to.exist;
    });

    it('logged in', async () => {
      mockFetchConfigWithoutPluginsJSONSuccess();
      mockFetchStatusWithProfileSuccess();
      mockHelixEnvironment(document, 'preview');

      sidekick = new AEMSidekick(defaultSidekickConfig);
      document.body.appendChild(sidekick);

      await waitUntil(() => recursiveQuery(sidekick, 'action-bar'));

      const actionBar = recursiveQuery(sidekick, 'action-bar');
      const actionGroups = recursiveQueryAll(actionBar, 'sp-action-group');
      const actionGroupsArray = [...actionGroups];
      expect(actionGroupsArray.length).to.equal(2);

      const systemActionGroup = actionGroupsArray[1];

      const propertiesButton = recursiveQuery(systemActionGroup, '.properties');
      expect(propertiesButton).to.exist;

      const loginButton = recursiveQuery(systemActionGroup, 'login-button');
      expect(loginButton).to.exist;
      expect(loginButton.classList.length).to.equal(0);

      const logo = recursiveQuery(systemActionGroup, 'svg');
      expect(logo).to.exist;
    });
  });
});
