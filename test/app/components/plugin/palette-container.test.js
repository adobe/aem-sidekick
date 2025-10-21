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
import { expect, waitUntil } from '@open-wc/testing';
import { recursiveQuery, recursiveQueryAll } from '../../../test-utils.js';
import chromeMock from '../../../mocks/chrome.js';
import { defaultSidekickConfig } from '../../../fixtures/sidekick-config.js';
import '../../../../src/extension/index.js';
import { AppStore } from '../../../../src/extension/app/store/app.js';
import { SidekickTest } from '../../../sidekick-test.js';

/**
 * The AEMSidekick object type
 * @typedef {import('../../../../src/extension/app/aem-sidekick.js').AEMSidekick} AEMSidekick
 */

// @ts-ignore
window.chrome = chromeMock;

describe('Palette container', () => {
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
    sidekickTest
      .mockFetchEditorStatusSuccess()
      .mockFetchSidekickConfigSuccess(true, true)
      .mockEditorAdminEnvironment();
  });

  afterEach(() => {
    sidekickTest.destroy();
  });

  async function openPalette(plugin = 'tag-selector') {
    sidekick = sidekickTest.createSidekick();

    await waitUntil(() => recursiveQuery(sidekick, 'action-bar-picker'));

    const toolsPlugin = recursiveQuery(sidekick, 'action-bar-picker.tools');
    const plugins = recursiveQueryAll(toolsPlugin, 'sk-menu-item');

    const tagSelectorPlugin = plugins.values().next().value;
    expect(tagSelectorPlugin).to.exist;
    expect(tagSelectorPlugin.textContent).to.equal('Tag Selector');

    toolsPlugin.value = plugin;
    toolsPlugin.dispatchEvent(new Event('change'));

    // Picker label should not change on selection
    const toolsPickerPluginLabel = recursiveQuery(toolsPlugin, '.label');
    expect(toolsPickerPluginLabel.textContent.trim()).to.equal('Tools');

    await waitUntil(() => recursiveQuery(sidekick, 'palette-container'));
  }

  it('closes palette plugin via close button', async () => {
    await openPalette();

    const paletteContainer = recursiveQuery(sidekick, 'palette-container');
    await waitUntil(() => recursiveQuery(paletteContainer, 'sp-action-button'));

    expect(sidekickTest.rumStub.calledWith('click', {
      source: 'sidekick',
      target: 'palette-opened',
    })).to.be.true;

    const closeButton = recursiveQuery(paletteContainer, 'sp-action-button');
    closeButton.click();

    const container = recursiveQuery(paletteContainer, '.container');
    await waitUntil(() => container.classList.contains('hidden'));
    expect(container.classList.contains('hidden')).to.be.true;
    expect(sidekickTest.rumStub.calledWith('click', {
      source: 'sidekick',
      target: 'palette-closed',
    })).to.be.true;
  }).timeout(20000);

  it('closes palette plugin via esc key', async () => {
    await openPalette();

    const paletteContainer = recursiveQuery(sidekick, 'palette-container');

    await waitUntil(() => recursiveQuery(paletteContainer, '.title'));
    paletteContainer.dispatchEvent(new KeyboardEvent('keydown', { key: 'QKey' }));
    expect(paletteContainer.plugin).to.exist;

    paletteContainer.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    const container = recursiveQuery(paletteContainer, '.container');
    await waitUntil(() => container.classList.contains('hidden'));
    expect(container.classList.contains('hidden')).to.be.true;
    expect(sidekickTest.rumStub.calledWith('click', {
      source: 'sidekick',
      target: 'palette-closed',
    })).to.be.true;
  });

  it('palette renders titleI18n', async () => {
    await openPalette('localize');

    const paletteContainer = recursiveQuery(sidekick, 'palette-container');
    await waitUntil(() => recursiveQuery(paletteContainer, '.title'));
    const title = recursiveQuery(paletteContainer, '.title');

    expect(title.textContent.trim()).to.equal('Localize project');
  });

  it('resizes palette via message', async () => {
    const { EventBus } = await import('../../../../src/extension/app/utils/event-bus.js');
    const { EVENTS } = await import('../../../../src/extension/app/constants.js');

    await openPalette('tag-selector');

    const paletteContainer = recursiveQuery(sidekick, 'palette-container');
    await waitUntil(() => recursiveQuery(paletteContainer, '.container'));
    const container = recursiveQuery(paletteContainer, '.container');

    // Dispatch resize event via EventBus
    EventBus.instance.dispatchEvent(new CustomEvent(EVENTS.RESIZE_PALETTE, {
      detail: {
        id: 'tag-selector',
        styles: 'width: 800px; height: 600px',
      },
    }));

    await waitUntil(() => container.style.width === '800px');
    expect(container.style.width).to.equal('800px');
    expect(container.style.height).to.equal('600px');

    // Resize with multiple properties
    EventBus.instance.dispatchEvent(new CustomEvent(EVENTS.RESIZE_PALETTE, {
      detail: {
        id: 'tag-selector',
        styles: 'width: 1000px; top: 10px',
      },
    }));

    await waitUntil(() => container.style.width === '1000px');
    expect(container.style.width).to.equal('1000px');
    expect(container.style.top).to.equal('10px');

    // Resize with height only
    EventBus.instance.dispatchEvent(new CustomEvent(EVENTS.RESIZE_PALETTE, {
      detail: {
        id: 'tag-selector',
        styles: 'height: 700px',
      },
    }));

    await waitUntil(() => container.style.height === '700px');
    expect(container.style.height).to.equal('700px');
  });

  it('resizes palette via message', async () => {
    const { EventBus } = await import('../../../../src/extension/app/utils/event-bus.js');
    const { EVENTS } = await import('../../../../src/extension/app/constants.js');

    await openPalette('tag-selector');

    const paletteContainer = recursiveQuery(sidekick, 'palette-container');
    await waitUntil(() => recursiveQuery(paletteContainer, '.container'));
    const container = recursiveQuery(paletteContainer, '.container');

    // Dispatch resize event via EventBus
    EventBus.instance.dispatchEvent(new CustomEvent(EVENTS.RESIZE_PALETTE, {
      detail: {
        id: 'tag-selector',
        styles: 'width: 800px; height: 600px',
      },
    }));

    await waitUntil(() => container.style.width === '800px');
    expect(container.style.width).to.equal('800px');
    expect(container.style.height).to.equal('600px');

    // Resize with multiple properties
    EventBus.instance.dispatchEvent(new CustomEvent(EVENTS.RESIZE_PALETTE, {
      detail: {
        id: 'tag-selector',
        styles: 'width: 1000px; top: 10px',
      },
    }));

    await waitUntil(() => container.style.width === '1000px');
    expect(container.style.width).to.equal('1000px');
    expect(container.style.top).to.equal('10px');

    // Resize with height only
    EventBus.instance.dispatchEvent(new CustomEvent(EVENTS.RESIZE_PALETTE, {
      detail: {
        id: 'tag-selector',
        styles: 'height: 700px',
      },
    }));

    await waitUntil(() => container.style.height === '700px');
    expect(container.style.height).to.equal('700px');
  });

  it('does not resize palette if id does not match', async () => {
    const { EventBus } = await import('../../../../src/extension/app/utils/event-bus.js');
    const { EVENTS } = await import('../../../../src/extension/app/constants.js');

    await openPalette('tag-selector');

    const paletteContainer = recursiveQuery(sidekick, 'palette-container');
    await waitUntil(() => recursiveQuery(paletteContainer, '.container'));
    const container = recursiveQuery(paletteContainer, '.container');

    const initialWidth = container.style.width;

    // Dispatch resize event with different id
    EventBus.instance.dispatchEvent(new CustomEvent(EVENTS.RESIZE_PALETTE, {
      detail: {
        id: 'different-plugin',
        styles: 'width: 999px',
      },
    }));

    // Wait a bit to ensure event is processed
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });

    // Style should not have changed
    expect(container.style.width).to.equal(initialWidth);
  });

  it('does not resize palette if styles is empty', async () => {
    const { EventBus } = await import('../../../../src/extension/app/utils/event-bus.js');
    const { EVENTS } = await import('../../../../src/extension/app/constants.js');

    await openPalette('tag-selector');

    const paletteContainer = recursiveQuery(sidekick, 'palette-container');
    await waitUntil(() => recursiveQuery(paletteContainer, '.container'));
    const container = recursiveQuery(paletteContainer, '.container');

    const initialWidth = container.style.width;

    // Dispatch resize event with empty styles
    EventBus.instance.dispatchEvent(new CustomEvent(EVENTS.RESIZE_PALETTE, {
      detail: {
        id: 'tag-selector',
        styles: '',
      },
    }));

    // Wait a bit to ensure event is processed
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });

    // Style should not have changed
    expect(container.style.width).to.equal(initialWidth);
  });

  it('hides container when hideContainer is called', async () => {
    await openPalette('tag-selector');

    const paletteContainer = recursiveQuery(sidekick, 'palette-container');
    await waitUntil(() => recursiveQuery(paletteContainer, '.container'));
    const container = recursiveQuery(paletteContainer, '.container');

    // Verify container is visible initially
    expect(container.classList.contains('hidden')).to.be.false;

    // Call hideContainer
    await paletteContainer.hideContainer();

    // Verify container is now hidden
    expect(container.classList.contains('hidden')).to.be.true;
  });

  it('handles hideContainer when container does not exist', async () => {
    await openPalette('tag-selector');

    const paletteContainer = recursiveQuery(sidekick, 'palette-container');
    await waitUntil(() => recursiveQuery(paletteContainer, '.container'));

    // Mock the container getter to return null
    const originalContainer = paletteContainer.container;
    Object.defineProperty(paletteContainer, 'container', {
      get: () => Promise.resolve(null),
      configurable: true,
    });

    // Call hideContainer - should not throw error
    await paletteContainer.hideContainer();

    // Restore original container
    Object.defineProperty(paletteContainer, 'container', {
      get: () => originalContainer,
      configurable: true,
    });
  });

  it('does not close palette via CLOSE_PALETTE event without ID', async () => {
    await openPalette();

    const paletteContainer = recursiveQuery(sidekick, 'palette-container');
    await waitUntil(() => recursiveQuery(paletteContainer, 'sp-action-button'));

    // Dispatch CLOSE_PALETTE event without ID (should NOT close)
    const { EventBus } = await import('../../../../src/extension/app/utils/event-bus.js');
    const { EVENTS } = await import('../../../../src/extension/app/constants.js');
    EventBus.instance.dispatchEvent(new CustomEvent(EVENTS.CLOSE_PALETTE));

    // Wait a bit to ensure it doesn't close
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });

    const container = recursiveQuery(paletteContainer, '.container');
    expect(container.classList.contains('hidden')).to.be.false;
  }).timeout(20000);

  it('closes palette via CLOSE_PALETTE event with matching ID', async () => {
    await openPalette('tag-selector');

    const paletteContainer = recursiveQuery(sidekick, 'palette-container');
    await waitUntil(() => recursiveQuery(paletteContainer, 'sp-action-button'));

    // Dispatch CLOSE_PALETTE event with matching ID
    const { EventBus } = await import('../../../../src/extension/app/utils/event-bus.js');
    const { EVENTS } = await import('../../../../src/extension/app/constants.js');
    EventBus.instance.dispatchEvent(new CustomEvent(EVENTS.CLOSE_PALETTE, {
      detail: { id: 'tag-selector' },
    }));

    const container = recursiveQuery(paletteContainer, '.container');
    await waitUntil(() => container.classList.contains('hidden'));
    expect(container.classList.contains('hidden')).to.be.true;
  }).timeout(20000);

  it('does not close palette via CLOSE_PALETTE event with non-matching ID', async () => {
    await openPalette('tag-selector');

    const paletteContainer = recursiveQuery(sidekick, 'palette-container');
    await waitUntil(() => recursiveQuery(paletteContainer, 'sp-action-button'));

    // Dispatch CLOSE_PALETTE event with different ID
    const { EventBus } = await import('../../../../src/extension/app/utils/event-bus.js');
    const { EVENTS } = await import('../../../../src/extension/app/constants.js');
    EventBus.instance.dispatchEvent(new CustomEvent(EVENTS.CLOSE_PALETTE, {
      detail: { id: 'different-plugin' },
    }));

    // Wait a bit to ensure it doesn't close
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });

    const container = recursiveQuery(paletteContainer, '.container');
    expect(container.classList.contains('hidden')).to.be.false;
  }).timeout(20000);

  it('handles hideContainer when container is not ready', async () => {
    sidekick = sidekickTest.createSidekick();
    await waitUntil(() => recursiveQuery(sidekick, 'action-bar-picker'));

    const paletteContainer = recursiveQuery(sidekick, 'palette-container');
    expect(paletteContainer).to.exist;

    // Try to hide container before it's been rendered (plugin is undefined)
    const rumCallCount = sidekickTest.rumStub.callCount;
    await paletteContainer.hideContainer();

    // Should not call RUM since container doesn't exist
    expect(sidekickTest.rumStub.callCount).to.equal(rumCallCount);
  });
});
