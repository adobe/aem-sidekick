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
import { render } from 'lit';
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

const TEST_BADGE_CONFIG = {
  id: 'test',
  isBadge: true,
  badgeVariant: 'orange',
  button: {
    text: 'Test Child',
    action: () => {},
  },
};

const TEST_POPOVER_CONFIG = {
  id: 'test',
  title: 'Test Popover',
  isPopover: true,
  popoverRect: 'width: 100px; height: 100px;',
  url: 'https://labs.aem.live/tools/snapshot-admin/palette.html?foo=bar&theme=dark',
  passConfig: false,
  passReferrer: false,
  button: {
    text: 'Test Child',
    action: () => {},
  },
};

describe('Plugin', () => {
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

  it('renders plugin as button', async () => {
    const plugin = new Plugin(TEST_CONFIG, appStore);
    // @ts-ignore
    const renderedPlugin = plugin.render().strings.join('');
    expect(renderedPlugin).to.contain('sp-action-button');
  });

  it('renders plugin as badge', async () => {
    const plugin = new Plugin(TEST_BADGE_CONFIG, appStore);
    const badge = plugin.isBadge();
    expect(badge).to.be.true;
    // @ts-ignore
    const renderedPlugin = plugin.render().strings.join('');
    expect(renderedPlugin).to.contain('sp-badge');
  });

  it('renders plugin as badge with default variant', async () => {
    const plugin = new Plugin({ ...TEST_BADGE_CONFIG, badgeVariant: undefined }, appStore);
    const badge = plugin.isBadge();
    expect(badge).to.be.true;

    const container = document.createElement('div');
    render(plugin.render(), container);

    // Wait for next time to let lit process the update
    await Promise.resolve();

    expect(container.querySelector('sp-badge')?.getAttribute('variant')).to.equal('default');
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

  it('renders a popover plugin', async () => {
    appStore.theme = 'dark';
    const plugin = new Plugin({ ...TEST_POPOVER_CONFIG }, appStore);

    const container = document.createElement('div');
    render(plugin.render(), container);

    // Wait for next time to let lit process the update
    await Promise.resolve();

    const overlayTrigger = container.querySelector('overlay-trigger');
    expect(overlayTrigger).to.exist;
    expect(overlayTrigger.getAttribute('offset')).to.equal('-3');

    const popover = container.querySelector('sp-popover');
    expect(popover).to.exist;
    expect(popover.getAttribute('placement')).to.equal('top');

    const popoverStyle = popover.getAttribute('style');
    expect(popoverStyle).to.include('width: 100px; height: 100px;');

    const iframe = container.querySelector('iframe');
    expect(iframe).to.exist;
    expect(iframe.getAttribute('title')).to.equal(TEST_POPOVER_CONFIG.title);
    expect(iframe.getAttribute('src')).to.equal(TEST_POPOVER_CONFIG.url);
  });

  it('popover plugin renders as menu item', async () => {
    appStore.location = new URL('https://www.example.com');
    appStore.theme = 'dark';
    appStore.siteStore.ref = 'main';
    appStore.siteStore.repo = 'test-repo';
    appStore.siteStore.owner = 'test-owner';
    appStore.siteStore.host = 'example.com';
    appStore.siteStore.project = 'test-project';
    appStore.siteStore.reviewHost = 'review.example.com';
    const config = { ...TEST_POPOVER_CONFIG, pinned: false };

    const plugin = new Plugin({ ...config }, appStore);

    const container = document.createElement('div');
    render(plugin.renderMenuItem(), container);

    // Wait for next time to let lit process the update
    await Promise.resolve();

    expect(container.querySelector('sk-menu-item')).to.exist;
    expect(container.querySelector('iframe')).to.exist;
  });

  it('default title is used for popover plugin', async () => {
    appStore.location = new URL('https://www.example.com');
    appStore.theme = 'dark';
    appStore.siteStore.ref = 'main';
    appStore.siteStore.repo = 'test-repo';
    appStore.siteStore.owner = 'test-owner';
    appStore.siteStore.host = 'example.com';
    appStore.siteStore.project = 'test-project';
    appStore.siteStore.reviewHost = 'review.example.com';
    const config = { ...TEST_POPOVER_CONFIG };
    config.title = undefined;

    const plugin = new Plugin({ ...config }, appStore);

    const container = document.createElement('div');
    render(plugin.render(), container);

    // Wait for next time to let lit process the update
    await Promise.resolve();

    expect(container.querySelector('iframe')?.getAttribute('title')).to.equal('Popover content');
  });

  it('renders a popover plugin with filtered popoverRect', async () => {
    const config = { ...TEST_POPOVER_CONFIG };
    config.popoverRect = 'width: 100px; height: 100px; background-color: red;';
    const plugin = new Plugin({ ...config }, appStore);

    const container = document.createElement('div');
    render(plugin.render(), container);

    // Wait for next time to let lit process the update
    await Promise.resolve();

    const popover = container.querySelector('sp-popover');
    const popoverStyle = popover.getAttribute('style');
    expect(popoverStyle).to.include('width: 100px; height: 100px;');
  });

  it('renders a popover without a popoverRect', async () => {
    const config = { ...TEST_POPOVER_CONFIG };
    config.popoverRect = undefined;
    const plugin = new Plugin({ ...config }, appStore);

    const container = document.createElement('div');
    render(plugin.render(), container);

    // Wait for next time to let lit process the update
    await Promise.resolve();

    const popover = container.querySelector('sp-popover');
    const popoverStyle = popover.getAttribute('style');
    expect(popoverStyle).to.be.null;
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
