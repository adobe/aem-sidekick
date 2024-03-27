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

import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import chromeMock from '../../../mocks/chrome.js';
import { Plugin } from '../../../../src/extension/app/components/plugin/plugin.js';
import { defaultConfigJSONWithPlugins } from '../../../fixtures/helix-admin.js';
import { appStore } from '../../../../src/extension/app/store/app.js';

// @ts-ignore
window.chrome = chromeMock;

describe('SidekickPlugin', () => {
  it('creates plugin from config', async () => {
    const plugin = new Plugin({
      ...defaultConfigJSONWithPlugins.plugins[0],
    });
    expect(plugin.config).to.deep.equal({
      ...defaultConfigJSONWithPlugins.plugins[0],
    });
  });

  it('validates plugin condition', async () => {
    const plugin = new Plugin({
      ...defaultConfigJSONWithPlugins.plugins[0],
    });
    const res = plugin.isVisible();
    expect(res).to.be.true;
  });

  it('appends child plugin', async () => {
    const plugin = new Plugin({
      ...defaultConfigJSONWithPlugins.plugins[0],
    });
    const childPlugin = new Plugin({
      ...defaultConfigJSONWithPlugins.plugins[1],
    });
    plugin.append(childPlugin);
    expect(Object.keys(plugin.children).length).to.equal(1);
  });

  it('is pinned by default', async () => {
    const plugin = new Plugin({
      ...defaultConfigJSONWithPlugins.plugins[0],
    });
    const pinned = plugin.isPinned();
    expect(pinned).to.be.true;
  });

  it('uses pinned state from config', async () => {
    const plugin = new Plugin({
      ...defaultConfigJSONWithPlugins.plugins[0],
      pinned: false,
    });
    const pinned = plugin.isPinned();
    expect(pinned).to.be.false;
  });

  it('pinned state from user prefs supersedes config', async () => {
    const sandbox = sinon.createSandbox();
    const plugin = new Plugin({
      ...defaultConfigJSONWithPlugins.plugins[0],
      pinned: false,
    });
    sandbox.stub(appStore, 'getPluginPrefs').returns({ pinned: true });
    const pinned = plugin.isPinned();
    expect(pinned).to.be.true;
    sandbox.restore();
  });
});
