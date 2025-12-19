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
import { aTimeout, expect, waitUntil } from '@open-wc/testing';
import { spy } from 'sinon';
import { AppStore } from '../src/extension/app/store/app.js';
import { recursiveQuery } from './test-utils.js';
import chromeMock from './mocks/chrome.js';
import { defaultSidekickConfig } from './fixtures/sidekick-config.js';
import '../src/extension/index.js';
import { HelixMockEnvironments, restoreEnvironment } from './mocks/environment.js';
import { SidekickTest } from './sidekick-test.js';
/**
 * The AEMSidekick object type
 * @typedef {import('../src/extension/app/aem-sidekick.js').AEMSidekick} AEMSidekick
 */

// @ts-ignore
window.chrome = chromeMock;

describe('AEM Sidekick', () => {
  /**
   * @type {SidekickTest}
   */
  let sidekickTest;

  /**
   * @type {AEMSidekick}
   */
  let sidekick;

  beforeEach(async () => {
    const appStoreTest = new AppStore();
    sidekickTest = new SidekickTest(defaultSidekickConfig, appStoreTest);

    sidekickTest
      .mockFetchStatusSuccess()
      .mockFetchSidekickConfigSuccess(true, false)
      .mockHelixEnvironment(HelixMockEnvironments.PREVIEW);
  });

  afterEach(() => {
    fetchMock.restore();
    restoreEnvironment(document);
    sidekickTest.destroy();
  });

  it('renders theme and action-bar', async () => {
    sidekick = sidekickTest.createSidekick();
    await sidekickTest.awaitEnvSwitcher();
    const theme = sidekick.shadowRoot.querySelector('theme-wrapper');
    expect(theme).to.exist;

    const spTheme = recursiveQuery(theme, 'sp-theme');
    expect(spTheme).to.exist;

    const { location } = sidekick;
    expect(location.href).to.eq('https://main--aem-boilerplate--adobe.hlx.page/');
    expect(sidekickTest.rumStub.called).to.be.true;
    expect(sidekickTest.rumStub.calledWithMatch('top', {
      source: 'sidekick',
    })).to.be.true;
  });

  it('dispatches sidekick-ready', async () => {
    const readySpy = spy();
    document.addEventListener('sidekick-ready', readySpy);

    sidekick = sidekickTest.createSidekick();
    await sidekickTest.awaitEnvSwitcher();

    expect(readySpy).to.have.been.calledOnce;
  });

  it('dispatches status-fetched', async () => {
    const statusSpy = spy();

    sidekick = sidekickTest.createSidekick();
    sidekick.addEventListener('status-fetched', statusSpy);
    await sidekickTest.awaitEnvSwitcher();

    expect(statusSpy).to.have.been.calledOnce;

    const { detail: data } = statusSpy.args[0][0];
    expect(data.webPath).to.eq('/');
    expect(data.resourcePath).to.eq('/index.md');
    expect(data.preview.status).to.eq(200);
    expect(data.live.status).to.eq(200);
  });

  describe('color themes', () => {
    it('renders dark theme by default', async () => {
      sidekick = sidekickTest.createSidekick();
      await sidekickTest.awaitEnvSwitcher();
      const themeWrapper = sidekick.shadowRoot.querySelector('theme-wrapper');

      const spTheme = themeWrapper.shadowRoot.querySelector('sp-theme');
      expect(spTheme).to.exist;
      expect(themeWrapper.getAttribute('theme')).to.equal('dark');
      expect(spTheme.getAttribute('color')).to.equal('dark');
    });

    it('renders light theme', async () => {
      sidekick = sidekickTest.createSidekick();
      await sidekickTest.awaitEnvSwitcher();
      const themeWrapper = sidekick.shadowRoot.querySelector('theme-wrapper');

      const spTheme = themeWrapper.shadowRoot.querySelector('sp-theme');
      expect(spTheme).to.exist;

      const menu = recursiveQuery(sidekick, '#sidekick-menu');
      menu.click();

      await waitUntil(() => menu.hasAttribute('open'));
      const themeSwitch = recursiveQuery(sidekick, 'sp-switch');
      themeSwitch.click();

      await waitUntil(() => spTheme.getAttribute('color') === 'light');
      expect(themeWrapper.getAttribute('theme')).to.equal('light');
      expect(spTheme.getAttribute('color')).to.equal('light');

      // toggle back to dark theme
      // Close the menu
      menu.click();

      // Open the menu so it can render in light switch state
      menu.click();

      expect(themeSwitch.hasAttribute('checked')).to.be.false;

      themeSwitch.click();
      await waitUntil(() => spTheme.getAttribute('color') === 'dark');
      expect(themeWrapper.getAttribute('theme')).to.equal('dark');
      expect(spTheme.getAttribute('color')).to.equal('dark');
    });
  });

  it('renders external notifications from extension', async () => {
    const sendResponse = spy();

    // const listener = chrome.runtime.onMessage.addListener.getCall(0).args[0];

    // Simulate a message from a valid sender
    const message = {
      action: 'show_notification',
      message: 'Test message',
      headline: 'Test headline',
    };
    const sender = {
      id: 'igkmdomcgoebiipaifhmpfjhbjccggml',
    };
    // stub message receiver and invoke callback
    sidekickTest.sandbox.stub(chrome.runtime.onMessage, 'addListener')
      .callsFake((func) => func(
        message,
        sender,
        sendResponse,
      ));

    sidekick = sidekickTest.createSidekick();
    await sidekickTest.awaitEnvSwitcher();

    await waitUntil(() => recursiveQuery(sidekick, 'modal-container') !== null);
    const modal = recursiveQuery(sidekick, 'modal-container');
    const headline = recursiveQuery(modal, 'h2');
    expect(headline.textContent.trim()).to.eq('Test headline');

    const closeButton = recursiveQuery(modal, 'sp-button');
    closeButton.click();
    expect(sendResponse).to.have.been.calledOnce;
  });

  it('ignores external notifications from invalid extension', async () => {
    const sendResponse = spy();

    // const listener = chrome.runtime.onMessage.addListener.getCall(0).args[0];

    // Simulate a message from a valid sender
    const message = {
      action: 'show_notification',
      message: 'Test message',
      headline: 'Test headline',
    };
    const sender = {
      id: 'unknown-extension',
    };
    // stub message receiver and invoke callback
    sidekickTest.sandbox.stub(chrome.runtime.onMessage, 'addListener')
      .callsFake((func) => func(
        message,
        sender,
        sendResponse,
      ));

    sidekick = sidekickTest.createSidekick();
    await sidekickTest.awaitEnvSwitcher();

    await aTimeout(1000);
    expect(recursiveQuery(sidekick, 'modal-container')).to.not.exist;
  });

  it('passes the a11y audit', async () => {
    sidekickTest
      .mockFetchSidekickConfigNotFound();

    sidekick = sidekickTest.createSidekick();
    document.addEventListener('sidekick-ready', async () => {
      await expect(sidekick).shadowDom.to.be.accessible();
    });
  });

  it('shows the onboarding dialog', async () => {
    sidekickTest.localStorageStub.resolves({ onboarded: false });
    sidekickTest
      .mockFetchOnboardingSuccess()
      .mockFetchStatusSuccess();

    const showOnboardingSpy = sidekickTest.sandbox.spy(sidekickTest.appStore, 'showOnboarding');
    sidekick = sidekickTest.createSidekick();
    sidekick.addEventListener('showonboarding', showOnboardingSpy);

    await sidekickTest.awaitEnvSwitcher();

    const themeWrapper = sidekick.shadowRoot.querySelector('theme-wrapper');
    await waitUntil(() => recursiveQuery(themeWrapper, 'onboarding-dialog'), 'Onboarding dialog not found', { timeout: 10000 });

    expect(showOnboardingSpy.calledOnce).to.be.true;
  });

  it('handles resizePalette message', async () => {
    const { EventBus } = await import('../src/extension/app/utils/event-bus.js');
    const { EVENTS } = await import('../src/extension/app/constants.js');
    const sendResponse = spy();

    const message = {
      action: 'resize_palette',
      id: 'test-palette',
      rect: {
        width: '600px',
        height: '400px',
      },
    };
    const sender = {};

    // Spy on EventBus.instance.dispatchEvent
    const dispatchEventSpy = sidekickTest.sandbox.spy(EventBus.instance, 'dispatchEvent');

    // stub message receiver and invoke callback
    sidekickTest.sandbox.stub(chrome.runtime.onMessage, 'addListener')
      .callsFake((func) => func(
        message,
        sender,
        sendResponse,
      ));

    sidekick = sidekickTest.createSidekick();
    await sidekickTest.awaitEnvSwitcher();

    // Verify dispatchEvent was called with correct event
    expect(dispatchEventSpy.calledOnce).to.be.true;
    const event = dispatchEventSpy.firstCall.args[0];
    expect(event.type).to.equal(EVENTS.RESIZE_PALETTE);
    expect(event.detail.id).to.equal('test-palette');
    expect(event.detail.styles).to.equal('width: 600px; height: 400px');

    // Verify sendResponse was called with true
    expect(sendResponse.calledWith(true)).to.be.true;
  });

  it('handles resizePalette message when container does not exist', async () => {
    const { EventBus } = await import('../src/extension/app/utils/event-bus.js');
    const { EVENTS } = await import('../src/extension/app/constants.js');
    const sendResponse = spy();

    const message = {
      action: 'resize_palette',
      id: 'non-existent-palette',
      rect: {
        width: '600px',
        height: '400px',
      },
    };
    const sender = {};

    // Spy on EventBus.instance.dispatchEvent
    const dispatchEventSpy = sidekickTest.sandbox.spy(EventBus.instance, 'dispatchEvent');

    // stub message receiver and invoke callback
    sidekickTest.sandbox.stub(chrome.runtime.onMessage, 'addListener')
      .callsFake((func) => func(
        message,
        sender,
        sendResponse,
      ));

    sidekick = sidekickTest.createSidekick();
    await sidekickTest.awaitEnvSwitcher();

    // Verify dispatchEvent was called (event is dispatched regardless of container existence)
    expect(dispatchEventSpy.calledOnce).to.be.true;
    const event = dispatchEventSpy.firstCall.args[0];
    expect(event.type).to.equal(EVENTS.RESIZE_PALETTE);
    expect(event.detail.id).to.equal('non-existent-palette');
    expect(event.detail.styles).to.equal('width: 600px; height: 400px');

    // Verify sendResponse was called with true
    expect(sendResponse.calledWith(true)).to.be.true;
  });

  it('handles resizePopover message', async () => {
    const { EventBus } = await import('../src/extension/app/utils/event-bus.js');
    const { EVENTS } = await import('../src/extension/app/constants.js');
    const sendResponse = spy();

    const message = {
      action: 'resize_popover',
      id: 'test-popover',
      rect: {
        width: '600px',
        height: '400px',
      },
    };
    const sender = {};

    // Spy on EventBus.instance.dispatchEvent
    const dispatchEventSpy = sidekickTest.sandbox.spy(EventBus.instance, 'dispatchEvent');

    // stub message receiver and invoke callback
    sidekickTest.sandbox.stub(chrome.runtime.onMessage, 'addListener')
      .callsFake((func) => func(
        message,
        sender,
        sendResponse,
      ));

    sidekick = sidekickTest.createSidekick();
    await sidekickTest.awaitEnvSwitcher();

    // Verify dispatchEvent was called with correct event
    expect(dispatchEventSpy.calledOnce).to.be.true;
    const event = dispatchEventSpy.firstCall.args[0];
    expect(event.type).to.equal(EVENTS.RESIZE_POPOVER);
    expect(event.detail.id).to.equal('test-popover');
    expect(event.detail.styles).to.equal('width: 600px; height: 400px');

    // Verify sendResponse was called with true
    expect(sendResponse.calledWith(true)).to.be.true;
  });

  it('handles closePalette message', async () => {
    const sendResponse = spy();

    const message = {
      action: 'close_palette',
      id: 'test-palette',
    };
    const sender = {};

    // stub message receiver and invoke callback
    sidekickTest.sandbox.stub(chrome.runtime.onMessage, 'addListener')
      .callsFake((func) => func(
        message,
        sender,
        sendResponse,
      ));

    sidekick = sidekickTest.createSidekick();
    await sidekickTest.awaitEnvSwitcher();

    // Verify sendResponse was called with true
    expect(sendResponse.calledWith(true)).to.be.true;
  });

  it('handles closePopover message', async () => {
    const sendResponse = spy();

    const message = {
      action: 'close_popover',
      id: 'test-popover',
    };
    const sender = {};

    // stub message receiver and invoke callback
    sidekickTest.sandbox.stub(chrome.runtime.onMessage, 'addListener')
      .callsFake((func) => func(
        message,
        sender,
        sendResponse,
      ));

    sidekick = sidekickTest.createSidekick();
    await sidekickTest.awaitEnvSwitcher();

    // Verify sendResponse was called with true
    expect(sendResponse.calledWith(true)).to.be.true;
  });
});
