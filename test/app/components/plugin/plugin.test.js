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
import { AppStore } from '../../../../src/extension/app/store/app.js';

// @ts-ignore
window.chrome = chromeMock;

const TEST_CONFIG = {
  id: 'test',
  condition: () => true,
  button: {
    text: 'Test',
    // eslint-disable-next-line no-console
    action: () => console.log('test'),
  },
};

const TEST_CHILD_CONFIG = {
  id: 'test-child',
  container: 'test',
  button: {
    text: 'Test Child',
    action: () => {},
  },
};

describe('Plugin', () => {
  const sandbox = sinon.createSandbox();
  const appStore = new AppStore();

  it('creates plugin from config', async () => {
    const plugin = new Plugin(TEST_CONFIG, appStore);
    expect(plugin.config).to.deep.equal(TEST_CONFIG);
  });

  it('validates plugin condition', async () => {
    const plugin = new Plugin(TEST_CONFIG, appStore);
    const res = plugin.isVisible();
    expect(res).to.be.true;
  });

  it('uses id as fallback to button text', async () => {
    const plugin = new Plugin({
      id: 'test',
      condition: () => true,
      button: {
        action: () => {},
      },
    }, appStore);
    expect(plugin.getButtonText()).to.equal('test');
  });

  it('can be a container with children', async () => {
    const parent = new Plugin(TEST_CONFIG, appStore);
    const child = new Plugin(TEST_CHILD_CONFIG, appStore);
    parent.append(child);
    expect(parent.isContainer()).to.be.true;
    expect(child.isChild()).to.be.true;
    expect(child.getContainerId()).to.equal('test');
  });

  it('is pinned by default', async () => {
    const plugin = new Plugin(TEST_CONFIG, appStore);
    const pinned = plugin.isPinned();
    expect(pinned).to.be.true;
  });

  it('uses pinned state from config', async () => {
    const plugin = new Plugin({
      ...TEST_CONFIG,
      pinned: false,
    }, appStore);
    const pinned = plugin.isPinned();
    expect(pinned).to.be.false;
  });

  it('pinned state from user prefs supersedes config', async () => {
    const plugin = new Plugin({
      ...TEST_CONFIG,
      pinned: false,
    }, appStore);
    sandbox.stub(appStore, 'getPluginPrefs').returns({ pinned: true });
    const pinned = plugin.isPinned();
    expect(pinned).to.be.true;
    sandbox.restore();
  });

  it('renders plugin as button', async () => {
    const plugin = new Plugin(TEST_CONFIG, appStore);
    // @ts-ignore
    const renderedPlugin = plugin.render().strings.join('');
    expect(renderedPlugin).to.contain('sp-action-button');
  });

  it('renders container plugin as picker', async () => {
    const parent = new Plugin({

    }, appStore);
    const child = new Plugin({
      ...TEST_CONFIG,
      container: 'tools',
    }, appStore);
    parent.append(child);
  });

  it('does not render if not pinned', async () => {
    const plugin = new Plugin({
      id: 'test',
      button: {
        text: 'Test',
        action: () => {},
      },
      pinned: false,
    }, appStore);
    const renderedPlugin = plugin.render();
    // @ts-ignore
    expect(renderedPlugin).to.equal('');
  });

  it('does not render container plugin if no children are visible', async () => {
    const parent = new Plugin(TEST_CONFIG, appStore);
    const child = new Plugin({
      ...TEST_CHILD_CONFIG,
      condition: () => false, // not visible
    }, appStore);
    parent.append(child);

    const renderedPlugin = parent.render();
    // @ts-ignore
    expect(renderedPlugin).to.equal('');
  });
});
