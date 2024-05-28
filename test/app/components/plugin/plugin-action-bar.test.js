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
import { setViewport } from '@web/test-runner-commands';
import { recursiveQuery, recursiveQueryAll } from '../../../test-utils.js';
import chromeMock from '../../../mocks/chrome.js';
import { defaultSidekickConfig } from '../../../fixtures/sidekick-config.js';
import '../../../../src/extension/index.js';
import {
  EditorMockEnvironments,
  HelixMockContentSources,
  HelixMockContentType,
  HelixMockEnvironments,
} from '../../../mocks/environment.js';
import { EXTERNAL_EVENTS } from '../../../../src/extension/app/constants.js';
import { pluginFactory } from '../../../../src/extension/app/plugins/plugin-factory.js';
import { AppStore } from '../../../../src/extension/app/store/app.js';
import { Plugin } from '../../../../src/extension/app/components/plugin/plugin.js';
import { SidekickTest } from '../../../sidekick-test.js';
import {
  defaultConfigUnpinnedContainerPlugin,
  defaultConfigUnpinnedPlugin,
  defaultConfigPlugins,
} from '../../../fixtures/helix-admin.js';

/**
 * The AEMSidekick object type
 * @typedef {import('../../../../src/extension/app/aem-sidekick.js').AEMSidekick} AEMSidekick
 */

/**
 * Calls WTR's setViewPort and fires a resize event on the window.
 * @param {Object} options The viewport options
 */
async function resizeWindow(options) {
  await setViewport(options);
  window.dispatchEvent(new Event('resize'));
}

// @ts-ignore
window.chrome = chromeMock;

describe('Plugin action bar', () => {
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
  });

  afterEach(async () => {
    sidekickTest.destroy();
  });

  function expectEnvPlugin(environments) {
    const actionBar = recursiveQuery(sidekickTest.sidekick, 'action-bar');
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

  function expectInActionBar(pluginIds) {
    const actionGroup = recursiveQuery(sidekickTest.sidekick, 'sp-action-group:first-of-type');
    const plugins = recursiveQueryAll(actionGroup, 'sp-action-button, env-switcher, action-bar-picker');

    expect(
      [...plugins].map((plugin) => plugin.className.replace('plugin-container ', '')
        || plugin.tagName.toLowerCase()),
    ).to.deep.equal(pluginIds);
  }

  async function expectInPluginMenu(pluginIds) {
    // wait for plugin menu
    await waitUntil(() => recursiveQuery(sidekick, '#plugin-menu'));
    const pluginMenu = recursiveQuery(sidekick, '#plugin-menu');
    const plugins = recursiveQueryAll(pluginMenu, 'sp-menu-item');

    expect([...plugins]
      .map((plugin) => plugin.className)).to.deep.equal(pluginIds);
  }

  describe('renders correct default plugins in action bar', () => {
    it('isPreview', async () => {
      sidekickTest
        .mockHelixEnvironment(HelixMockEnvironments.PREVIEW)
        .mockFetchStatusSuccess()
        .mockFetchSidekickConfigSuccess(false, false)
        .createSidekick();

      await sidekickTest.awaitEnvSwitcher();

      expectInActionBar([
        'env-switcher',
        'reload',
        'publish',
      ]);

      expectEnvPlugin(['preview', 'edit', 'live']);
    });

    it('editor - w/custom plugins', async () => {
      sidekickTest
        .mockFetchStatusSuccess()
        .mockFetchSidekickConfigSuccess(true, true)
        .mockFetchEditorStatusSuccess()
        .mockEditorAdminEnvironment(EditorMockEnvironments.EDITOR);

      sidekick = sidekickTest.createSidekick();

      await sidekickTest.awaitEnvSwitcher();
      await aTimeout(500);

      expectInActionBar([
        'env-switcher',
        'edit-preview',
        'assets',
        'library',
        'tools',
      ]);

      expectEnvPlugin(['preview', 'prod']);

      // Should fallback to id for label if title not provided
      const assetLibraryPlugin = recursiveQuery(sidekick, '.assets');
      expect(assetLibraryPlugin.textContent.trim()).to.equal('assets');
    });

    it('isLive', async () => {
      sidekickTest
        .mockHelixEnvironment(HelixMockEnvironments.LIVE)
        .mockFetchStatusSuccess()
        .mockFetchSidekickConfigSuccess(false, false);

      sidekickTest.createSidekick();

      await sidekickTest.awaitEnvSwitcher();

      expectInActionBar([
        'env-switcher',
        'publish',
      ]);

      expectEnvPlugin(['preview', 'edit', 'live']);
    });

    it('isProd', async () => {
      sidekickTest
        .mockFetchStatusSuccess()
        .mockFetchSidekickConfigSuccess(false, false)
        .mockHelixEnvironment(HelixMockEnvironments.PROD)
        .createSidekick();

      await sidekickTest.awaitEnvSwitcher();

      expectInActionBar([
        'env-switcher',
        'publish',
      ]);

      expectEnvPlugin(['prod', 'preview', 'edit']);
    });

    it('Unsupported env', async () => {
      sidekickTest
        .mockFetchStatusSuccess()
        .mockFetchSidekickConfigSuccess(false, false)
        .mockLocation('https://www.example.com')
        .createSidekick();

      await sidekickTest.awaitEnvSwitcher();

      expectInActionBar([
        'env-switcher',
      ]);

      expectEnvPlugin([]);
    });

    it('isDev', async () => {
      sidekickTest
        .mockFetchStatusSuccess()
        .mockFetchSidekickConfigSuccess(true, false)
        .mockHelixEnvironment(HelixMockEnvironments.DEV)
        .createSidekick();

      await sidekickTest.awaitEnvSwitcher();

      expectEnvPlugin(['dev', 'edit', 'preview', 'prod']);
      expectInActionBar([
        'env-switcher',
        'reload',
        'publish',
      ]);
    });

    it('isEditor', async () => {
      sidekickTest
        .mockFetchEditorStatusSuccess(HelixMockContentSources.SHAREPOINT, HelixMockContentType.DOC)
        .mockFetchSidekickConfigSuccess(false, false)
        .mockEditorAdminEnvironment(EditorMockEnvironments.EDITOR)
        .createSidekick();

      await sidekickTest.awaitEnvSwitcher();

      expectInActionBar([
        'env-switcher',
        'edit-preview',
      ]);

      expectEnvPlugin(['preview', 'live']);
    });

    it('isEditor - custom config with prod host', async () => {
      sidekickTest
        .mockFetchEditorStatusSuccess(HelixMockContentSources.SHAREPOINT, HelixMockContentType.DOC)
        .mockFetchSidekickConfigSuccess(true, false)
        .mockEditorAdminEnvironment(EditorMockEnvironments.EDITOR)
        .createSidekick();

      await sidekickTest.awaitEnvSwitcher();

      expectInActionBar([
        'env-switcher',
        'edit-preview',
      ]);

      expectEnvPlugin(['preview', 'prod']);
    });

    it('isPreview - custom config with prod host', async () => {
      sidekickTest
        .mockFetchStatusSuccess()
        .mockFetchSidekickConfigSuccess(true, false)
        .mockHelixEnvironment(HelixMockEnvironments.PREVIEW)
        .createSidekick();

      await sidekickTest.awaitEnvSwitcher();

      expectInActionBar([
        'env-switcher',
        'reload',
        'publish',
      ]);

      expectEnvPlugin(['preview', 'edit', 'prod']);
    });

    it('core plugin clicked', async () => {
      const { sandbox } = sidekickTest;

      sidekickTest
        .mockFetchStatusSuccess()
        .mockFetchSidekickConfigSuccess(true, false)
        .mockHelixEnvironment(HelixMockEnvironments.PREVIEW);

      window.hlx = {};
      const actionFunction = async () => Promise.resolve();

      // Create a spy for the action function
      const actionSpy = sandbox.spy(actionFunction);

      sandbox.stub(pluginFactory, 'createPublishPlugin').returns(new Plugin({
        id: 'publish',
        condition: () => true,
        button: {
          text: 'Publish',
          action: actionSpy,
        },
      }, appStore));

      sidekick = sidekickTest.createSidekick();

      await sidekickTest.awaitEnvSwitcher();

      expectInActionBar([
        'env-switcher',
        'reload',
        'publish',
      ]);

      const publishButton = recursiveQuery(sidekick, '.publish');
      publishButton.click();

      await waitUntil(() => actionSpy.calledOnce);
      expect(actionSpy.calledOnce).to.be.true;
    });

    it('isAdmin - loads correct plugins', async () => {
      sidekickTest
        .mockFetchEditorStatusSuccess(HelixMockContentSources.SHAREPOINT, HelixMockContentType.DOC)
        .mockFetchSidekickConfigSuccess(false, false)
        .mockEditorAdminEnvironment(EditorMockEnvironments.ADMIN)
        .createSidekick();

      // TODO: Expand tests when bulk plugin is added
      // expectPluginCount(0);
    });

    it('custom container plugin', async () => {
      const { sandbox } = sidekickTest;

      sidekickTest
        .mockFetchEditorStatusSuccess(HelixMockContentSources.SHAREPOINT, HelixMockContentType.DOC)
        .mockFetchSidekickConfigSuccess(true, true)
        .mockEditorAdminEnvironment(EditorMockEnvironments.EDITOR);

      sidekick = sidekickTest.createSidekick();

      const fireEventStub = sandbox.stub(appStore, 'fireEvent');
      await sidekickTest.awaitEnvSwitcher();

      expectInActionBar([
        'env-switcher',
        'edit-preview',
        'assets',
        'library',
        'tools',
      ]);

      const toolsPlugin = recursiveQuery(sidekick, 'action-bar-picker.tools');
      const plugins = recursiveQueryAll(toolsPlugin, 'sp-menu-item');

      expect([...plugins].length).to.equal(3);
      expect(plugins.values().next().value.textContent).to.equal('Tag Selector');

      plugins.values().next().value.click();
      await aTimeout(100);
      expect(fireEventStub.calledWith(
        EXTERNAL_EVENTS.PLUGIN_USED,
        { id: 'tag-selector' },
      )).to.be.true;
    });

    it('custom plugin clicked', async () => {
      const { sandbox } = sidekickTest;
      sidekickTest
        .mockFetchEditorStatusSuccess(HelixMockContentSources.SHAREPOINT, HelixMockContentType.DOC)
        .mockFetchSidekickConfigSuccess(true, true)
        .mockEditorAdminEnvironment(EditorMockEnvironments.EDITOR);

      sidekick = sidekickTest.createSidekick();

      sandbox.stub(appStore, 'validateSession').resolves();
      const fireEventStub = sandbox.stub(appStore, 'fireEvent');
      const openPageStub = sandbox.stub(appStore, 'openPage');

      await waitUntil(() => recursiveQuery(sidekick, 'action-bar-picker'));

      expectInActionBar([
        'env-switcher',
        'edit-preview',
        'assets',
        'library',
        'tools',
      ]);

      const libraryPlugin = recursiveQuery(sidekick, '.library');
      libraryPlugin.click();

      await waitUntil(() => openPageStub.calledOnce);
      expect(openPageStub.calledOnce).to.be.true;
      expect(fireEventStub.calledWith(EXTERNAL_EVENTS.PLUGIN_USED, { id: 'library' })).to.be.true;

      recursiveQuery(sidekick, '.tools').click();
      const preflightPlugin = recursiveQuery(sidekick, '[value="preflight"]');
      preflightPlugin.click();

      await aTimeout(100);

      expect(fireEventStub.calledWithMatch('custom:preflight')).to.be.true;
      expect(fireEventStub.calledWith(EXTERNAL_EVENTS.PLUGIN_USED, { id: 'preflight' })).to.be.true;
    });

    it('overrides core plugin', async () => {
      sidekickTest
        .mockFetchStatusSuccess(false, {}, HelixMockContentSources.SHAREPOINT, 'https://admin.hlx.page/status/adobe/aem-boilerplate/main/en/drafts/test')
        .mockFetchSidekickConfigSuccess(true, true)
        .mockHelixEnvironment(HelixMockEnvironments.PREVIEW, undefined, 'https://main--aem-boilerplate--adobe.aem.page/en/drafts/test');

      sidekick = sidekickTest.createSidekick();

      await sidekickTest.awaitEnvSwitcher();
      expect(recursiveQuery(sidekick, '.publish')).to.equal(undefined);
    });
  });

  describe('plugin menu', () => {
    it('omitted if no unpinned plugins', async () => {
      sidekickTest
        .mockFetchStatusSuccess()
        .mockFetchSidekickConfigSuccess()
        .mockHelixEnvironment(HelixMockEnvironments.PREVIEW);

      sidekick = sidekickTest.createSidekick();

      await sidekickTest.awaitEnvSwitcher();

      const pluginMenu = recursiveQuery(sidekick, '#plugin-menu');
      expect(pluginMenu).to.not.exist;
    });

    it('opens and closes on click', async () => {
      sidekickTest
        .mockFetchStatusSuccess(true)
        .mockFetchSidekickConfigSuccess()
        .mockHelixEnvironment(HelixMockEnvironments.PREVIEW);

      sidekick = sidekickTest.createSidekick();

      await sidekickTest.awaitEnvSwitcher();

      // open plugin menu
      const pluginMenu = recursiveQuery(sidekick, '#plugin-menu');
      expect(pluginMenu).to.exist;
      pluginMenu.click();
      await aTimeout(100);
      expect(pluginMenu.hasAttribute('open')).to.be.true;

      // close plugin menu
      pluginMenu.click();
      await aTimeout(100);
      expect(pluginMenu.hasAttribute('open')).to.be.true;
    });

    it('contains unpinned plugins', async () => {
      const { sandbox } = sidekickTest;
      sidekickTest
        .mockFetchStatusSuccess(true)
        .mockFetchSidekickConfigSuccess(false, false, defaultConfigUnpinnedPlugin)
        .mockHelixEnvironment(HelixMockEnvironments.PREVIEW);

      sidekick = sidekickTest.createSidekick();

      await sidekickTest.awaitEnvSwitcher();

      const customPluginId = 'custom-plugin-0'; // generated id

      // open plugin menu
      const pluginMenu = recursiveQuery(sidekick, '#plugin-menu');
      expect(pluginMenu).to.exist;
      pluginMenu.click();
      await aTimeout(100);
      expect(pluginMenu.hasAttribute('open')).to.be.true;

      // check for delete plugin
      expect(recursiveQuery(pluginMenu, '.delete')).to.exist;

      // check for unpinned plugin
      const unPinnedPlugin = recursiveQuery(pluginMenu, `.${customPluginId}`);
      expect(unPinnedPlugin).to.exist;

      const openPageStub = sandbox.stub(appStore, 'openPage');
      unPinnedPlugin.click();
      await aTimeout(100);
      expect(openPageStub.calledOnce).to.be.true;
    });

    it('renders unpinned container as menu group', async () => {
      sidekickTest
        .mockFetchStatusSuccess(true)
        .mockFetchSidekickConfigSuccess(false, false, defaultConfigUnpinnedContainerPlugin)
        .mockHelixEnvironment(HelixMockEnvironments.PREVIEW);

      sidekick = sidekickTest.createSidekick();

      await sidekickTest.awaitEnvSwitcher();

      // open plugin menu
      const pluginMenu = recursiveQuery(sidekick, '#plugin-menu');
      expect(pluginMenu).to.exist;

      // check container and child plugin
      const unpinnedContainer = recursiveQuery(pluginMenu, 'sp-menu-group#plugin-group-tools');
      expect(unpinnedContainer).to.exist;
      const childPlugin = recursiveQuery(unpinnedContainer, '.tool');
      expect(childPlugin).to.exist;
    });

    it('renders correct plugins in preview', async () => {
      sidekickTest
        .mockFetchStatusSuccess(true)
        .mockFetchSidekickConfigSuccess()
        .mockHelixEnvironment(HelixMockEnvironments.PREVIEW)
        .createSidekick();

      sidekick = sidekickTest.createSidekick();

      await sidekickTest.awaitEnvSwitcher();

      await expectInPluginMenu([
        'delete',
        'unpublish',
      ]);
    });

    it('renders correct plugins in live', async () => {
      sidekickTest
        .mockFetchStatusSuccess(true)
        .mockFetchSidekickConfigSuccess()
        .mockHelixEnvironment(HelixMockEnvironments.LIVE)
        .createSidekick();

      sidekick = sidekickTest.createSidekick();

      await sidekickTest.awaitEnvSwitcher();

      await expectInPluginMenu([
        'unpublish',
      ]);
    });

    it('renders correct plugins in prod', async () => {
      sidekickTest
        .mockFetchStatusSuccess(true)
        .mockFetchSidekickConfigSuccess(true, false)
        .mockHelixEnvironment(HelixMockEnvironments.PROD)
        .createSidekick();

      sidekick = sidekickTest.createSidekick();

      await sidekickTest.awaitEnvSwitcher();

      await expectInPluginMenu([
        'unpublish',
      ]);
    });

    it('moves plugins between bar and plugin menu based on available space', async () => {
      sidekickTest
        .mockFetchEditorStatusSuccess(HelixMockContentSources.SHAREPOINT, HelixMockContentType.DOC)
        .mockFetchSidekickConfigSuccess(false, false, {
          plugins: [
            ...defaultConfigPlugins.plugins,
            ...defaultConfigUnpinnedPlugin.plugins,
          ],
        })
        .mockEditorAdminEnvironment(EditorMockEnvironments.EDITOR)
        .createSidekick();

      sidekick = sidekickTest.createSidekick();

      await sidekickTest.awaitEnvSwitcher();
      await aTimeout(100);

      const customPluginId = 'custom-plugin-9'; // generated id

      // check initial state
      expectInActionBar([
        'env-switcher',
        'edit-preview',
        'assets',
        'library',
        'tools',
      ]);
      expectInPluginMenu([
        customPluginId,
      ]);

      // make viewport narrower
      await resizeWindow({ width: 600, height: 600 });
      await aTimeout(100);

      // check if tools container plugin moved to plugin menu
      expectInActionBar([
        'env-switcher',
        'edit-preview',
        'assets',
        'library',
      ]);
      await expectInPluginMenu([
        'tag-selector',
        'checkschema',
        'preflight',
        'predicted-url',
        'localize',
        customPluginId,
      ]);

      // make viewport narrower
      await resizeWindow({ width: 475, height: 600 });
      await aTimeout(100);

      // check if library plugin and tools container moved to plugin menu
      expectInActionBar([
        'env-switcher',
        'edit-preview',
        'assets',
      ]);
      await expectInPluginMenu([
        'library',
        'tag-selector',
        'checkschema',
        'preflight',
        'predicted-url',
        'localize',
        customPluginId,
      ]);

      // make viewport wider again
      await resizeWindow({ width: 600, height: 600 });
      await resizeWindow({ width: 850, height: 600 });
      await aTimeout(100);

      // check if all plugins moved back to bar
      expectInActionBar([
        'env-switcher',
        'edit-preview',
        'assets',
        'library',
        'tools',
      ]);
      await expectInPluginMenu([
        customPluginId,
      ]);
    });
  });

  describe('login states', () => {
    it('not logged in, site has authentication enabled', async () => {
      sidekickTest
        .mockFetchSidekickConfigUnAuthorized()
        .mockFetchStatusUnauthorized()
        .mockHelixEnvironment(HelixMockEnvironments.PREVIEW);

      sidekick = sidekickTest.createSidekick();

      await sidekickTest.awaitActionBar();

      const actionBar = recursiveQuery(sidekick, 'action-bar');
      const systemActionGroup = recursiveQuery(actionBar, 'sp-action-group:last-of-type');
      expect(recursiveQuery(actionBar, 'login-button')).to.exist;

      const propertiesButton = recursiveQuery(systemActionGroup, '#properties');
      expect(propertiesButton).to.exist;

      const loginButton = recursiveQuery(systemActionGroup, '#user');
      expect(loginButton).to.exist;
      expect(loginButton.classList.length).to.equal(1);
      expect(loginButton.classList.contains('not-authorized')).to.be.true;

      const logo = recursiveQuery(systemActionGroup, 'svg');
      expect(logo).to.exist;
    });

    it('not logged in, site does not have authentication enabled', async () => {
      sidekickTest
        .mockFetchSidekickConfigSuccess(true, false)
        .mockFetchStatusSuccess()
        .mockHelixEnvironment(HelixMockEnvironments.PREVIEW);

      sidekick = sidekickTest.createSidekick();

      await sidekickTest.awaitEnvSwitcher();

      const actionBar = recursiveQuery(sidekick, 'action-bar');
      const actionGroups = recursiveQueryAll(actionBar, 'sp-action-group');
      const actionGroupsArray = [...actionGroups];
      expect(actionGroupsArray.length).to.equal(3);

      const systemActionGroup = actionGroupsArray[2];

      const propertiesButton = recursiveQuery(systemActionGroup, '#properties');
      expect(propertiesButton).to.exist;

      const loginButton = recursiveQuery(systemActionGroup, '#user');
      expect(loginButton).to.exist;

      const logo = recursiveQuery(systemActionGroup, 'svg');
      expect(logo).to.exist;
    });

    it('not logged in, site does not have authentication enabled', async () => {
      sidekickTest
        .mockFetchSidekickConfigSuccess(true, false)
        .mockFetchStatusSuccess()
        .mockHelixEnvironment(HelixMockEnvironments.PREVIEW);

      sidekick = sidekickTest.createSidekick();

      await sidekickTest.awaitEnvSwitcher();

      const actionBar = recursiveQuery(sidekick, 'action-bar');
      const actionGroups = recursiveQueryAll(actionBar, 'sp-action-group');
      const actionGroupsArray = [...actionGroups];
      expect(actionGroupsArray.length).to.equal(3);

      const systemActionGroup = actionGroupsArray[2];

      const propertiesButton = recursiveQuery(systemActionGroup, '#properties');
      expect(propertiesButton).to.exist;

      const loginButton = recursiveQuery(systemActionGroup, '#user');
      expect(loginButton).to.exist;
      expect(loginButton.className === '').to.be.true;

      const logo = recursiveQuery(systemActionGroup, 'svg');
      expect(logo).to.exist;
    });

    it('logged in', async () => {
      const { sandbox } = sidekickTest;
      sidekickTest
        .mockFetchSidekickConfigSuccess(true, false)
        .mockFetchStatusSuccess(true)
        .mockHelixEnvironment(HelixMockEnvironments.PREVIEW);

      sidekick = sidekickTest.createSidekick();

      const statusFetchedSpy = sandbox.spy();

      sidekick.addEventListener('statusfetched', statusFetchedSpy);

      await waitUntil(() => recursiveQuery(sidekick, 'action-bar'));
      await aTimeout(100);

      const actionBar = recursiveQuery(sidekick, 'action-bar');
      const actionGroups = recursiveQueryAll(actionBar, 'sp-action-group');
      const actionGroupsArray = [...actionGroups];
      expect(actionGroupsArray.length).to.equal(3);

      const systemActionGroup = actionGroupsArray[2];

      const propertiesButton = recursiveQuery(systemActionGroup, '#properties');
      expect(propertiesButton).to.exist;

      const loginButton = recursiveQuery(systemActionGroup, '#user');
      expect(loginButton).to.exist;
      expect(loginButton.classList.length).to.equal(0);

      const logo = recursiveQuery(systemActionGroup, 'svg');
      expect(logo).to.exist;
    });
  });
});
