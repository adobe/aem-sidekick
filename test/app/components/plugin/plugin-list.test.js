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

import { aTimeout, expect, waitUntil } from '@open-wc/testing';
import { recursiveQuery, recursiveQueryAll } from '../../../test-utils.js';
import chromeMock from '../../../mocks/chrome.js';
import { defaultSidekickConfig } from '../../../fixtures/sidekick-config.js';
import '../../../../src/extension/index.js';
import {
  HelixMockEnvironments,
  EditorMockEnvironments,
  HelixMockContentType,
  HelixMockContentSources,
} from '../../../mocks/environment.js';
import { AppStore } from '../../../../src/extension/app/store/app.js';
import { PluginList } from '../../../../src/extension/app/components/plugin/plugin-list/plugin-list.js';
import { SidekickTest } from '../../../sidekick-test.js';

/**
 * The AEMSidekick object type
 * @typedef {import('../../../../src/extension/app/aem-sidekick.js').AEMSidekick} AEMSidekick
 */

// @ts-ignore
window.chrome = chromeMock;

async function createPluginList() {
  const pluginList = new PluginList();
  document.body.append(pluginList);

  await waitUntil(() => recursiveQuery(pluginList, 'sp-menu-item'));
  return pluginList;
}

describe.skip('Plugin list', () => {
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

  let getPluginPrefsStub;
  let setPluginPrefsStub;

  beforeEach(async () => {
    appStore = new AppStore();
    sidekickTest = new SidekickTest(defaultSidekickConfig, appStore);
    sidekickTest
      .mockFetchStatusSuccess();

    const { sandbox } = sidekickTest;
    getPluginPrefsStub = sandbox.stub(appStore, 'getPluginPrefs').resolves({});
    setPluginPrefsStub = sandbox.stub(appStore, 'setPluginPrefs');
  });

  afterEach(() => {
    sidekickTest.destroy();
  });

  it('isPreview', async () => {
    sidekickTest
      .mockFetchSidekickConfigSuccess(false, false)
      .mockHelixEnvironment(HelixMockEnvironments.PREVIEW);

    sidekick = sidekickTest.createSidekick();
    const pluginList = await createPluginList();
    expect(getPluginPrefsStub.called).to.be.true;

    const plugins = [...recursiveQueryAll(pluginList, 'sp-menu-item')];
    expect(plugins.length).to.equal(4);
  });

  it('isEditor - w/custom plugins', async () => {
    sidekickTest
      .mockFetchSidekickConfigSuccess(false, true)
      .mockEditorAdminEnvironment(
        EditorMockEnvironments.EDITOR,
        HelixMockContentType.DOC,
      ).mockFetchEditorStatusSuccess(
        HelixMockContentSources.SHAREPOINT,
        HelixMockContentType.DOC,
      );

    sidekick = sidekickTest.createSidekick();
    const pluginList = await createPluginList();
    await aTimeout(500);

    const plugins = [...recursiveQueryAll(pluginList, 'sp-menu-item')];
    expect(plugins.length).to.equal(6);
    const childPlugins = plugins.filter((p) => recursiveQuery(p, 'span.parent:not(:empty)'));
    expect(childPlugins.length).to.equal(3);
  });

  it('toggles plugin', async () => {
    sidekickTest
      .mockFetchSidekickConfigSuccess(false, false)
      .mockHelixEnvironment(HelixMockEnvironments.PREVIEW);

    sidekick = sidekickTest.createSidekick();
    const pluginList = await createPluginList();
    const pluginToggles = [...recursiveQueryAll(pluginList, '.menu-item-container > sp-button')];
    pluginToggles[0].click(); // unpin reload plugin
    pluginToggles[1].click(); // pin delete plugin

    expect(setPluginPrefsStub.callCount).to.equal(2);
  });

  it('filters plugins', async () => {
    const { sandbox } = sidekickTest;
    sidekickTest
      .mockFetchSidekickConfigSuccess(false, false)
      .mockHelixEnvironment(HelixMockEnvironments.PREVIEW);

    sidekick = sidekickTest.createSidekick();
    const pluginList = await createPluginList();

    let plugins = [...recursiveQueryAll(pluginList, 'sp-menu-item')];
    expect(plugins.length).to.equal(4);

    // filters plugins
    const filterField = recursiveQuery(pluginList, 'sp-textfield');
    filterField.value = 'publish';
    filterField.dispatchEvent(new Event('input')); // trigger filtering
    await aTimeout(100);

    plugins = [...recursiveQueryAll(pluginList, 'sp-menu-item')];
    expect(plugins.length).to.equal(2);

    // moves focus to first menu item
    filterField.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowDown' }));
    expect(plugins[0].hasAttribute('focused')).to.be.true;
    filterField.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowUp' }));

    // change filter
    filterField.value = 'unpublish';
    filterField.dispatchEvent(new Event('input')); // trigger filtering
    await aTimeout(100);

    plugins = [...recursiveQueryAll(pluginList, 'sp-menu-item')];
    expect(plugins.length).to.equal(1);

    // does not move focus to first menu item
    filterField.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowDown' }));
    expect(plugins.filter((p) => p.getAttribute('focused')).length).to.equal(0);

    // change filter
    filterField.value = 'publish';
    filterField.dispatchEvent(new Event('input')); // trigger filtering
    await aTimeout(100);

    const publishStub = sandbox.stub(appStore, 'publish');

    // moves focus to first menu item and executes action
    filterField.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter' }));
    await aTimeout(100);
    expect(publishStub.called).to.be.true;
  });

  it('closes modal on escape key in filter field', async () => {
    sidekickTest
      .mockFetchSidekickConfigSuccess(false, false)
      .mockHelixEnvironment(HelixMockEnvironments.PREVIEW);

    sidekick = sidekickTest.createSidekick();
    const pluginList = await createPluginList();

    const plugins = [...recursiveQueryAll(pluginList, 'sp-menu-item')];
    expect(plugins.length).to.equal(4);

    // filters plugins
    const filterField = recursiveQuery(pluginList, 'sp-textfield');
    filterField.dispatchEvent(new KeyboardEvent('keyup', { key: 'Escape' }));
    await aTimeout(100);

    expect(recursiveQuery(sidekick, 'modal-container')).to.be.undefined;
  });
});
