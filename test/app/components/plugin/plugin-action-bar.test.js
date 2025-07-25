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
import { setViewport, sendKeys } from '@web/test-runner-commands';
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
import { AppStore } from '../../../../src/extension/app/store/app.js';
import { SidekickTest } from '../../../sidekick-test.js';
import {
  defaultConfigUnpinnedContainerPlugin,
  defaultConfigUnpinnedPlugin,
  defaultConfigPlugins,
  defaultConfigPluginsWithBadge,
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
      const envButton = recursiveQuery(picker, `sk-menu-item.env-${env}`);
      expect(envButton, `Button for ${env} does not exist`).to.exist;
    });

    const menuButtons = recursiveQueryAll(picker, 'sk-menu-item');
    expect([...menuButtons].length).to.equal(environments.length);
  }

  function expectInActionBar(pluginIds) {
    const actionGroup = recursiveQuery(sidekickTest.sidekick, '.action-group');
    const plugins = recursiveQueryAll(actionGroup, 'sp-action-button, env-switcher, bulk-info, action-bar-picker');
    expect(
      [...plugins].map((plugin) => plugin.className.replace('plugin-container ', '')
        || plugin.tagName.toLowerCase()),
    ).to.deep.equal(pluginIds);
  }

  async function expectInPluginMenu(pluginIds) {
    // wait for plugin menu
    await waitUntil(() => recursiveQuery(sidekick, '#plugin-menu'));
    const pluginMenu = recursiveQuery(sidekick, '#plugin-menu');
    const plugins = recursiveQueryAll(pluginMenu, 'sk-menu-item');

    expect([...plugins]
      .map((plugin) => plugin.className)).to.deep.equal(pluginIds);
  }

  function expectInBadgeContainer(pluginIds) {
    const badgeContainer = recursiveQuery(sidekickTest.sidekick, '.badge-plugins-container');
    const badges = recursiveQueryAll(badgeContainer, 'sp-badge');

    expect([...badges]
      .map((badge) => badge.className)).to.deep.equal(pluginIds);
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
        'edit',
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

      expectEnvPlugin(['edit', 'preview', 'prod']);

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
        'edit',
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
        'edit',
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
        'edit',
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

      expectEnvPlugin(['edit', 'preview', 'live']);
    });

    it('Editor - should display "last edited" description for Source', async () => {
      sidekickTest
        .mockFetchEditorStatusSuccess(HelixMockContentSources.SHAREPOINT, HelixMockContentType.DOC)
        .mockFetchSidekickConfigSuccess(false, false)
        .mockEditorAdminEnvironment(EditorMockEnvironments.EDITOR)
        .createSidekick();

      await sidekickTest.awaitEnvSwitcher();

      const envPlugin = recursiveQuery(sidekickTest.sidekick, 'env-switcher');
      const menuItem = recursiveQuery(envPlugin, 'sk-menu-item.env-edit');

      await waitUntil(() => {
        const descriptionElement = menuItem.querySelector('[slot="description"]');
        return descriptionElement;
      }, 'Description element not found', { timeout: 5000 });

      const description = menuItem.querySelector('[slot="description"]');
      const localeDateString = description.textContent.substring(11);
      expect(localeDateString.length).to.be.greaterThan(0);
      expect(new Date(localeDateString).toUTCString()).to.equal('Fri, 21 Jul 2023 19:58:00 GMT');
    });

    it('Preview - should display "open in" description for Source', async () => {
      sidekickTest
        .mockFetchStatusSuccess()
        .mockFetchSidekickConfigSuccess(false)
        .mockHelixEnvironment(HelixMockEnvironments.PREVIEW);

      sidekick = sidekickTest.createSidekick();

      await sidekickTest.awaitEnvSwitcher();

      const actionBar = recursiveQuery(sidekick, 'action-bar');
      const envPlugin = recursiveQuery(actionBar, 'env-switcher');
      const menuItem = recursiveQuery(envPlugin, 'sk-menu-item.env-edit');

      const description = menuItem.querySelector('[slot="description"]');
      expect(description.textContent).to.equal('Open in Google Drive');
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

      expectEnvPlugin(['edit', 'preview', 'prod']);
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
        'edit',
        'reload',
        'publish',
      ]);

      expectEnvPlugin(['preview', 'edit', 'prod']);
    });

    it.skip('core plugin clicked', async () => {
      const { sandbox } = sidekickTest;

      sidekickTest
        .mockFetchStatusSuccess()
        .mockFetchSidekickConfigSuccess(true, false)
        .mockHelixEnvironment(HelixMockEnvironments.PREVIEW);

      window.hlx = {};
      const actionFunction = async () => Promise.resolve();

      // Create a spy for the action function
      const actionSpy = sandbox.spy(actionFunction);

      // sandbox.stub(pluginFactory, 'createPublishPlugin').returns(new Plugin({
      //   id: 'publish',
      //   condition: () => true,
      //   button: {
      //     text: 'Publish',
      //     action: actionSpy,
      //   },
      // }, appStore));

      sidekick = sidekickTest.createSidekick();

      await sidekickTest.awaitEnvSwitcher();

      expectInActionBar([
        'env-switcher',
        'edit',
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
        .mockAdminDOM(EditorMockEnvironments.ADMIN)
        .toggleAdminItems(['document'])
        .createSidekick();

      await aTimeout(100);
      expectInActionBar([
        'bulk-info',
        'bulk-preview',
        'bulk-publish',
        'bulk-copy-urls',
      ]);
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
      const plugins = recursiveQueryAll(toolsPlugin, 'sk-menu-item');

      expect([...plugins].length).to.equal(3);
      expect(plugins.values().next().value.textContent).to.equal('Tag Selector');

      plugins.values().next().value.click();
      await aTimeout(100);
      expect(fireEventStub.calledWith(EXTERNAL_EVENTS.PLUGIN_USED, 'tag-selector')).to.be.true;
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
      expect(fireEventStub.calledWith(EXTERNAL_EVENTS.PLUGIN_USED, 'library')).to.be.true;

      recursiveQuery(sidekick, '.tools').click();
      const preflightPlugin = recursiveQuery(sidekick, '[value="preflight"]');
      preflightPlugin.click();

      await aTimeout(100);

      expect(fireEventStub.calledWithMatch('custom:preflight')).to.be.true;
      expect(fireEventStub.calledWith(EXTERNAL_EVENTS.PLUGIN_USED, 'preflight')).to.be.true;
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
      expect(pluginMenu.hasAttribute('open')).to.be.false;
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
      await aTimeout(100);
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
        .mockHelixEnvironment(HelixMockEnvironments.PREVIEW);

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
        .mockHelixEnvironment(HelixMockEnvironments.LIVE);

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
        .mockHelixEnvironment(HelixMockEnvironments.PROD);

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
        .mockEditorAdminEnvironment(EditorMockEnvironments.EDITOR);

      await resizeWindow({ width: 1200, height: 600 });

      sidekick = sidekickTest.createSidekick();

      await sidekickTest.awaitEnvSwitcher();
      await aTimeout(200);

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
      await resizeWindow({ width: 630, height: 600 });
      await aTimeout(300);

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
      await resizeWindow({ width: 500, height: 600 });
      await aTimeout(300);
      // check if library plugin and tools container moved to plugin menu
      expectInActionBar([
        'env-switcher',
        'edit-preview',
      ]);
      await expectInPluginMenu([
        'assets',
        'library',
        'tag-selector',
        'checkschema',
        'preflight',
        'predicted-url',
        'localize',
        customPluginId,
      ]);

      // simulate dragging the viewport wider again
      await resizeWindow({ width: 650, height: 600 });
      await aTimeout(500);
      await resizeWindow({ width: 750, height: 600 });
      await aTimeout(500);
      await resizeWindow({ width: 800, height: 600 });
      await aTimeout(500);

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

      /**
       * Small to large fast
       */
      await resizeWindow({ width: 500, height: 600 });
      await aTimeout(300);
      // check if library plugin and tools container moved to plugin menu
      expectInActionBar([
        'env-switcher',
        'edit-preview',
      ]);
      await expectInPluginMenu([
        'assets',
        'library',
        'tag-selector',
        'checkschema',
        'preflight',
        'predicted-url',
        'localize',
        customPluginId,
      ]);

      // simulate dragging the viewport wider again
      await resizeWindow({ width: 1000, height: 600 });
      await aTimeout(500);

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
    }).timeout(100000);
  });

  describe('login states', () => {
    it('not logged in, site has authentication enabled', async () => {
      sidekickTest
        .mockFetchSidekickConfigUnauthorized()
        .mockFetchStatusUnauthorized()
        .mockHelixEnvironment(HelixMockEnvironments.PREVIEW);

      sidekick = sidekickTest.createSidekick();

      await sidekickTest.awaitActionBar();

      const actionBar = recursiveQuery(sidekick, 'action-bar');
      const systemActionGroup = recursiveQuery(actionBar, '.system-plugins-container');
      expect(recursiveQuery(actionBar, 'login-button')).to.exist;

      const sidekickMenuButton = recursiveQuery(systemActionGroup, '#sidekick-menu');
      expect(sidekickMenuButton).to.exist;

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
      const actionGroups = recursiveQueryAll(actionBar, '.action-group');
      const actionGroupsArray = [...actionGroups];
      expect(actionGroupsArray.length).to.equal(3);

      const systemActionGroup = actionGroupsArray[2];

      const sidekickMenuButton = recursiveQuery(systemActionGroup, '#sidekick-menu');
      expect(sidekickMenuButton).to.exist;

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
      const actionGroups = recursiveQueryAll(actionBar, '.action-group');
      const actionGroupsArray = [...actionGroups];
      expect(actionGroupsArray.length).to.equal(3);

      const systemActionGroup = actionGroupsArray[2];

      const sidekickMenuButton = recursiveQuery(systemActionGroup, '#sidekick-menu');
      expect(sidekickMenuButton).to.exist;

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

      sidekick.addEventListener('status-fetched', statusFetchedSpy);

      await waitUntil(() => recursiveQuery(sidekick, 'action-bar'));
      await aTimeout(100);

      const actionBar = recursiveQuery(sidekick, 'action-bar');
      const actionGroups = recursiveQueryAll(actionBar, '.action-group');
      const actionGroupsArray = [...actionGroups];
      expect(actionGroupsArray.length).to.equal(3);

      const systemActionGroup = actionGroupsArray[2];

      const sidekickMenuButton = recursiveQuery(systemActionGroup, '#sidekick-menu');
      expect(sidekickMenuButton).to.exist;

      const loginButton = recursiveQuery(systemActionGroup, '#user');
      expect(loginButton).to.exist;
      expect(loginButton.classList.length).to.equal(0);

      const logo = recursiveQuery(systemActionGroup, 'svg');
      expect(logo).to.exist;
    });
  });

  describe('sidekick menu', () => {
    beforeEach(async () => {
      sidekickTest
        .mockFetchSidekickConfigSuccess(true, false)
        .mockFetchStatusSuccess(true)
        .mockHelixEnvironment(HelixMockEnvironments.PREVIEW);
    });

    it('transient mode', async () => {
      sidekick = sidekickTest.createSidekick({
        ...defaultSidekickConfig,
        transient: true,
      });

      const messageSpy = sidekickTest.sandbox.stub(window.chrome.runtime, 'sendMessage').returns(null);

      const toggleProjectSpy = sidekickTest.sandbox.spy();
      sidekick.addEventListener('projectaddremoved', toggleProjectSpy);

      await waitUntil(() => recursiveQuery(sidekick, 'action-bar'));

      const sidekickMenuButton = recursiveQuery(sidekick, '#sidekick-menu');
      expect(sidekickMenuButton).to.exist;

      sidekickMenuButton.click();

      await waitUntil(() => sidekickMenuButton.hasAttribute('open'));

      const addProjectButton = recursiveQuery(sidekickMenuButton, 'sk-menu-item[value="project-added"]');
      expect(addProjectButton).to.exist;

      addProjectButton.click();

      await waitUntil(() => !sidekickMenuButton.hasAttribute('open'), 'sidekick menu did not close', { timeout: 3000 });
      expect(messageSpy.calledTwice).to.be.true;
      expect(sidekickTest.rumStub.calledWith('click', {
        source: 'sidekick',
        target: 'project-added',
      })).to.be.true;
    }).timeout(10000);

    it('not transient mode', async () => {
      sidekick = sidekickTest.createSidekick({
        ...defaultSidekickConfig,
        transient: false,
      });

      const messageSpy = sidekickTest.sandbox.stub(window.chrome.runtime, 'sendMessage').returns(null);

      await waitUntil(() => recursiveQuery(sidekick, 'action-bar'));

      const sidekickMenuButton = recursiveQuery(sidekick, '#sidekick-menu');
      expect(sidekickMenuButton).to.exist;

      sidekickMenuButton.click();

      await waitUntil(() => sidekickMenuButton.hasAttribute('open'));

      const addProjectButton = recursiveQuery(sidekickMenuButton, 'sk-menu-item[value="project-removed"]');
      expect(addProjectButton).to.exist;
      addProjectButton.click();

      await waitUntil(() => !sidekickMenuButton.hasAttribute('open'), 'sidekick menu did not close', { timeout: 3000 });

      expect(messageSpy.callCount).to.equal(3);
      expect(sidekickTest.rumStub.calledWith('click', {
        source: 'sidekick',
        target: 'project-removed',
      })).to.be.true;
    }).timeout(10000);

    it('close extension', async () => {
      sidekick = sidekickTest.createSidekick({
        ...defaultSidekickConfig,
        transient: false,
      });

      await sidekickTest.awaitEnvSwitcher();

      const closeSpy = sidekickTest.sandbox.spy();
      sidekick.addEventListener('hidden', closeSpy);

      const closeButton = recursiveQuery(sidekick, '.close-button');
      expect(closeButton).to.exist;
      closeButton.click();

      await waitUntil(() => closeSpy.called, 'sidekick did not close', { timeout: 3000 });

      expect(closeSpy.calledOnce).to.be.true;
    }).timeout(10000);

    it('open project admin', async () => {
      sidekickTest.sandbox.stub(chrome.storage.sync, 'get').resolves({
        projects: ['foo/bar'],
      });

      const { sandbox } = sidekickTest;
      sidekick = sidekickTest.createSidekick({
        ...defaultSidekickConfig,
        transient: false,
      });

      await waitUntil(() => recursiveQuery(sidekick, 'action-bar'));

      const sidekickMenuButton = recursiveQuery(sidekick, '#sidekick-menu');
      expect(sidekickMenuButton).to.exist;

      sidekickMenuButton.click();

      await waitUntil(() => sidekickMenuButton.hasAttribute('open'));

      const sendMessageStub = sandbox.stub(window.chrome.runtime, 'sendMessage').returns(null);
      const projectAdminButton = recursiveQuery(sidekickMenuButton, 'sk-menu-item[value="project-admin-opened"]');
      expect(projectAdminButton).to.exist;
      projectAdminButton.click();

      await aTimeout(200);
      await waitUntil(() => !sidekickMenuButton.hasAttribute('open'), 'sidekick menu did not close', { timeout: 3000 });
      expect(sendMessageStub.calledWith({
        // @ts-ignore
        action: 'manageProjects',
      })).to.be.true;
      expect(sidekickTest.rumStub.calledWith('click', {
        source: 'sidekick',
        target: 'project-admin-opened',
      })).to.be.true;
    }).timeout(10000);

    it('open documentation', async () => {
      const { sandbox } = sidekickTest;
      sidekick = sidekickTest.createSidekick({
        ...defaultSidekickConfig,
        transient: false,
      });

      await waitUntil(() => recursiveQuery(sidekick, 'action-bar'));

      const sidekickMenuButton = recursiveQuery(sidekick, '#sidekick-menu');
      expect(sidekickMenuButton).to.exist;

      sidekickMenuButton.click();

      await waitUntil(() => sidekickMenuButton.hasAttribute('open'));

      const openPageStub = sandbox.stub(sidekickTest.appStore, 'openPage').returns(null);
      const helpButton = recursiveQuery(sidekickMenuButton, 'sk-menu-item[value="help-opened"]');
      expect(helpButton).to.exist;
      helpButton.click();

      await aTimeout(200);
      await waitUntil(() => !sidekickMenuButton.hasAttribute('open'), 'sidekick menu did not close', { timeout: 3000 });
      expect(openPageStub.calledOnce).to.be.true;
      expect(sidekickTest.rumStub.calledWith('click', {
        source: 'sidekick',
        target: 'help-opened',
      })).to.be.true;
    }).timeout(10000);

    it('open whats new', async () => {
      const { sandbox } = sidekickTest;
      sidekick = sidekickTest.createSidekick({
        ...defaultSidekickConfig,
        transient: false,
      });

      await waitUntil(() => recursiveQuery(sidekick, 'action-bar'));

      const sidekickMenuButton = recursiveQuery(sidekick, '#sidekick-menu');
      expect(sidekickMenuButton).to.exist;

      sidekickMenuButton.click();

      await waitUntil(() => sidekickMenuButton.hasAttribute('open'));

      const showOnboardingStub = sandbox.stub(sidekickTest.appStore, 'showOnboarding').returns(null);
      const helpButton = recursiveQuery(sidekickMenuButton, 'sk-menu-item[value="whats-new-opened"]');
      expect(helpButton).to.exist;
      helpButton.click();

      await aTimeout(200);
      await waitUntil(() => !sidekickMenuButton.hasAttribute('open'), 'sidekick menu did not close', { timeout: 3000 });
      expect(showOnboardingStub.calledOnce).to.be.true;
      expect(sidekickTest.rumStub.calledWith('click', {
        source: 'sidekick',
        target: 'whats-new-opened',
      })).to.be.true;
    }).timeout(10000);
  });

  describe('tab order', () => {
    it('verify tab order through action-bar', async () => {
      sidekickTest
        .mockFetchStatusSuccess()
        .mockFetchSidekickConfigSuccess(true, true)
        .mockFetchEditorStatusSuccess()
        .mockEditorAdminEnvironment(EditorMockEnvironments.EDITOR);

      await resizeWindow({ width: 1200, height: 600 });

      sidekick = sidekickTest.createSidekick();

      await sidekickTest.awaitActionBar();

      function createFocusSpy(element) {
        const spy = sidekickTest.sandbox.spy();
        element.addEventListener('focus', spy);
        return spy;
      }

      const actionBar = recursiveQuery(sidekick, 'action-bar');

      await waitUntil(() => recursiveQuery(actionBar, '.library'));

      expectInActionBar([
        'env-switcher',
        'edit-preview',
        'assets',
        'library',
        'tools',
      ]);

      const envSwitcher = recursiveQuery(actionBar, 'env-switcher');
      const envSwitcherFocusSpy = createFocusSpy(envSwitcher);

      const previewButton = recursiveQuery(actionBar, '.edit-preview');
      const previewFocusSpy = createFocusSpy(previewButton);

      const assetsButton = recursiveQuery(actionBar, '.assets');
      const assetsFocusSpy = createFocusSpy(assetsButton);

      const libraryButton = recursiveQuery(actionBar, '.library');
      const libraryFocusSpy = createFocusSpy(libraryButton);

      const toolsButton = recursiveQuery(actionBar, '.tools');
      const toolsFocusSpy = createFocusSpy(toolsButton);

      const sidekickMenu = recursiveQuery(actionBar, '#sidekick-menu');
      const sidekickMenuFocusSpy = createFocusSpy(sidekickMenu);

      const loginButton = recursiveQuery(actionBar, 'login-button');
      const loginActionButton = recursiveQuery(loginButton, 'sp-action-button.login');
      const loginButtonFocusSpy = createFocusSpy(loginActionButton);

      // Tab into location input
      await sendKeys({ press: 'Tab' });

      // Tab into environment switcher
      await sendKeys({ press: 'Tab' });

      await waitUntil(() => envSwitcherFocusSpy.called, 'env-switcher did not focus', { timeout: 3000 });
      await sendKeys({ press: 'Tab' });
      await waitUntil(() => previewFocusSpy.calledOnce, 'preview did not focus', { timeout: 3000 });
      await sendKeys({ press: 'Tab' });
      await waitUntil(() => assetsFocusSpy.calledOnce, 'assets did not focus', { timeout: 3000 });
      await sendKeys({ press: 'Tab' });
      await waitUntil(() => libraryFocusSpy.calledOnce, 'library did not focus', { timeout: 3000 });
      await sendKeys({ press: 'Tab' });
      await waitUntil(() => toolsFocusSpy.calledOnce, 'tools did not focus', { timeout: 3000 });
      await sendKeys({ press: 'Tab' });
      await waitUntil(() => sidekickMenuFocusSpy.calledOnce, 'sidekick menu did not focus', { timeout: 3000 });
      await sendKeys({ press: 'Tab' });
      await waitUntil(() => loginButtonFocusSpy.calledOnce, 'login did not focus', { timeout: 3000 });
    }).timeout(10000);
  });

  describe('badge plugins', () => {
    it('renders badge plugins', async () => {
      sidekickTest
        .mockFetchStatusSuccess()
        .mockFetchSidekickConfigSuccess(true, true, defaultConfigPluginsWithBadge)
        .mockHelixEnvironment(HelixMockEnvironments.PREVIEW);

      sidekick = sidekickTest.createSidekick();

      await sidekickTest.awaitBadgeContainer();

      expectInBadgeContainer([
        'badge',
      ]);
    });
  });

  describe('error toast handling', () => {
    it('4xx: shows warning toast', async () => {
      const showToastSpy = sidekickTest.sandbox.spy(sidekickTest.appStore, 'showToast');

      sidekickTest
        .mockFetchStatusNotFound()
        .mockFetchSidekickConfigSuccess(true, true);

      sidekick = sidekickTest.createSidekick();

      await waitUntil(() => showToastSpy.calledOnce);

      expect(showToastSpy.calledWithMatch({
        variant: 'warning',
        timeout: 0,
      })).to.be.true;
    });

    it('5xx: shows negative toast with details action button', async () => {
      const showToastSpy = sidekickTest.sandbox.spy(sidekickTest.appStore, 'showToast');
      const showModalStub = sidekickTest.sandbox.spy(sidekickTest.appStore, 'showModal');
      const errorMessage = 'first byte timeout';

      sidekickTest
        .mockFetchStatusError()
        .mockFetchSidekickConfigSuccess(true, true);

      sidekick = sidekickTest.createSidekick();

      await waitUntil(() => showToastSpy.calledOnce);

      expect(showToastSpy.calledWithMatch({
        variant: 'negative',
        timeout: 0,
      })).to.be.true;

      const actionButton = recursiveQuery(sidekick, 'sp-action-button.action');
      expect(actionButton).to.exist;
      expect(actionButton.textContent.trim()).to.equal('Details');
      actionButton.click();

      await waitUntil(() => showModalStub.calledOnce);

      expect(showModalStub.calledWith({
        type: 'error',
        data: {
          message: errorMessage,
        },
      })).to.be.true;
    });

    it('5xx status error: shows negative toast and removes sidekick on close', async () => {
      const showToastSpy = sidekickTest.sandbox.spy(sidekickTest.appStore, 'showToast');

      sidekickTest
        .mockFetchStatusError()
        .mockFetchSidekickConfigSuccess(true, true);

      sidekick = sidekickTest.createSidekick();

      await waitUntil(() => showToastSpy.calledOnce);

      expect(showToastSpy.calledWithMatch({
        variant: 'negative',
        timeout: 0,
      })).to.be.true;

      const closeButton = recursiveQuery(sidekick, 'sp-action-button.close');
      expect(closeButton).to.exist;
      closeButton.click();

      await waitUntil(() => !recursiveQuery(document.body, 'aem-sidekick'));
    });
  });
});
