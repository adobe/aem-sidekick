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
import { emulateMedia } from '@web/test-runner-commands';
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

    // detect color scheme change
    await emulateMedia({ colorScheme: 'light' });
    // todo: check if color scheme change is getting picked up
    // expect(theme.getAttribute('color')).to.equal('light');
    const spTheme = recursiveQuery(theme, 'sk-theme');
    expect(spTheme).to.exist;

    const { location } = sidekick;
    expect(location.href).to.eq('https://main--aem-boilerplate--adobe.hlx.page/');
    expect(sidekickTest.rumStub.called).to.be.true;
    expect(sidekickTest.rumStub.calledWith('click', {
      source: 'sidekick',
      target: 'loaded:chrome',
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
    it('renders light theme', async () => {
      await emulateMedia({ colorScheme: 'light' });
      sidekick = sidekickTest.createSidekick();
      await sidekickTest.awaitEnvSwitcher();
      const themeWrapper = sidekick.shadowRoot.querySelector('theme-wrapper');

      const spTheme = themeWrapper.shadowRoot.querySelector('sk-theme');
      expect(spTheme).to.exist;

      expect(spTheme.getAttribute('color')).to.equal('light');
    });

    it('renders dark theme', async () => {
      await emulateMedia({ colorScheme: 'dark' });
      sidekick = sidekickTest.createSidekick();
      await sidekickTest.awaitEnvSwitcher();
      const themeWrapper = sidekick.shadowRoot.querySelector('theme-wrapper');

      const spTheme = themeWrapper.shadowRoot.querySelector('sk-theme');
      expect(spTheme).to.exist;

      // todo: check if color scheme change is getting picked up
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
});
