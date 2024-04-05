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

// @ts-ignore
import fetchMock from 'fetch-mock/esm/client.js';
import { aTimeout, expect, waitUntil } from '@open-wc/testing';
import sinon from 'sinon';
import { recursiveQuery, recursiveQueryAll } from '../../../test-utils.js';
import chromeMock from '../../../mocks/chrome.js';
import { AEMSidekick } from '../../../../src/extension/app/aem-sidekick.js';
import { mockFetchEnglishMessagesSuccess } from '../../../mocks/i18n.js';
import { defaultSidekickConfig } from '../../../fixtures/sidekick-config.js';
import {
  mockSharepointEditorDocFetchStatusSuccess,
  mockFetchConfigWithPluginsJSONSuccess,
  mockFetchStatusSuccess,
  mockFetchConfigWithoutPluginsOrHostJSONSuccess,
} from '../../../mocks/helix-admin.js';
import '../../../../src/extension/index.js';
import {
  mockHelixEnvironment,
  mockEditorAdminEnvironment,
  restoreEnvironment,
} from '../../../mocks/environment.js';
import { appStore } from '../../../../src/extension/app/store/app.js';
import { PluginList } from '../../../../src/extension/app/components/plugin/plugin-list/plugin-list.js';

// @ts-ignore
window.chrome = chromeMock;

async function createPluginList(sidekick) {
  document.body.appendChild(sidekick);

  const pluginList = new PluginList();
  document.body.append(pluginList);

  await waitUntil(() => recursiveQuery(pluginList, 'sp-menu-item'));
  return pluginList;
}

describe('Plugin list', () => {
  const sandbox = sinon.createSandbox();
  let getPluginPrefsStub;
  let setPluginPrefsStub;

  beforeEach(async () => {
    mockFetchEnglishMessagesSuccess();
    getPluginPrefsStub = sandbox.stub(appStore, 'getPluginPrefs').resolves({});
    setPluginPrefsStub = sandbox.stub(appStore, 'setPluginPrefs');
  });

  afterEach(() => {
    fetchMock.reset();
    restoreEnvironment(document);
    sandbox.restore();
  });

  it('isPreview', async () => {
    mockFetchStatusSuccess();
    mockFetchConfigWithoutPluginsOrHostJSONSuccess();
    mockHelixEnvironment(document, 'preview');

    const pluginList = await createPluginList(new AEMSidekick(defaultSidekickConfig));
    expect(getPluginPrefsStub.called).to.be.true;

    const plugins = [...recursiveQueryAll(pluginList, 'sp-menu-item')];
    expect(plugins.length).to.equal(4);
  });

  it('isEditor - w/custom plugins', async () => {
    mockFetchStatusSuccess();
    mockFetchConfigWithPluginsJSONSuccess();
    mockSharepointEditorDocFetchStatusSuccess();
    mockEditorAdminEnvironment(document, 'editor');

    const pluginList = await createPluginList(new AEMSidekick(defaultSidekickConfig));
    await aTimeout(500);

    const plugins = [...recursiveQueryAll(pluginList, 'sp-menu-item')];
    expect(plugins.length).to.equal(6);
    const childPlugins = plugins.filter((p) => recursiveQuery(p, 'span.parent:not(:empty)'));
    expect(childPlugins.length).to.equal(3);
  });

  it('toggles plugin', async () => {
    mockFetchStatusSuccess();
    mockFetchConfigWithoutPluginsOrHostJSONSuccess();
    mockHelixEnvironment(document, 'preview');

    const pluginList = await createPluginList(new AEMSidekick(defaultSidekickConfig));
    const pluginToggles = [...recursiveQueryAll(pluginList, '.menu-item-container > sp-button')];
    pluginToggles[0].click(); // unpin reload plugin
    pluginToggles[1].click(); // pin delete plugin

    expect(setPluginPrefsStub.callCount).to.equal(2);
  });

  it('filters plugins', async () => {
    mockFetchStatusSuccess();
    mockFetchConfigWithoutPluginsOrHostJSONSuccess();
    mockHelixEnvironment(document, 'preview');

    const pluginList = await createPluginList(new AEMSidekick(defaultSidekickConfig));

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
  });
});
