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
import { html } from 'lit';
import { fixture, expect } from '@open-wc/testing';
import { emulateMedia } from '@web/test-runner-commands';
import { recursiveQuery } from './test-utils.js';
import chromeMock from './mocks/chrome.js';
import { AEMSidekick } from '../../src/extension/app/aem-sidekick.js';
import { mockFetchEnglishMessagesSuccess } from './mocks/i18n.js';
import { defaultSidekickConfig } from './fixtures/sidekick-config.js';
import { mockFetchConfigJSONNotFound, mockFetchStatusSuccess } from './mocks/helix-admin.js';
import '../../src/extension/index.js';
import { mockHelixEnvironment, restoreEnvironment } from './mocks/environment.js';

// @ts-ignore
window.chrome = chromeMock;

describe('AEM Sidekick', () => {
  beforeEach(async () => {
    mockFetchEnglishMessagesSuccess();
    mockFetchStatusSuccess();
    mockHelixEnvironment(document, 'preview');
  });

  afterEach(() => {
    fetchMock.restore();
    restoreEnvironment(document);
  });

  it('renders theme and action-bar', async () => {
    const element = await fixture(html`<aem-sidekick></aem-sidekick>`);
    const theme = element.shadowRoot.querySelector('theme-wrapper');
    expect(theme).to.exist;

    // detect color scheme change
    await emulateMedia({ colorScheme: 'light' });
    // todo: check if color scheme change is getting picked up
    // expect(theme.getAttribute('color')).to.equal('light');

    const spTheme = recursiveQuery(theme, 'sp-theme');
    expect(spTheme).to.exist;
  });

  describe('color themes', () => {
    it('renders light theme', async () => {
      await emulateMedia({ colorScheme: 'light' });
      const element = await fixture(html`<aem-sidekick></aem-sidekick>`);
      const themeWrapper = element.shadowRoot.querySelector('theme-wrapper');

      const spTheme = themeWrapper.shadowRoot.querySelector('sp-theme');
      expect(spTheme).to.exist;

      expect(spTheme.getAttribute('color')).to.equal('light');
    });

    it('renders dark theme', async () => {
      await emulateMedia({ colorScheme: 'dark' });
      const element = await fixture(html`<aem-sidekick></aem-sidekick>`);
      const themeWrapper = element.shadowRoot.querySelector('theme-wrapper');

      const spTheme = themeWrapper.shadowRoot.querySelector('sp-theme');
      expect(spTheme).to.exist;

      // todo: check if color scheme change is getting picked up
      expect(spTheme.getAttribute('color')).to.equal('dark');
    });
  });

  describe('configuration loading', () => {
    it('default config', async () => {
      mockFetchConfigJSONNotFound();
      const sidekick = new AEMSidekick(defaultSidekickConfig);
      document.body.appendChild(sidekick);

      sidekick.addEventListener('contextloaded', (event) => {
        // @ts-ignore
        const { detail } = event;
        const { data } = detail;
        expect(data).to.exist;
        expect(data.config).to.exist;
        expect(data.config.owner).to.eq('adobe');
        expect(data.config.repo).to.eq('aem-boilerplate');
        expect(data.config.ref).to.eq('main');
        expect(data.config.giturl).to.eq('https://github.com/adobe/aem-boilerplate');
        expect(data.config.lang).to.eq('en');
        expect(data.config.views.length).to.eq(1);

        expect(data.location).to.exist;
        expect(data.location.host).to.eq('main--aem-boilerplate--adobe.hlx.page');
      });
    });
  });

  it('passes the a11y audit', async () => {
    mockFetchConfigJSONNotFound();
    const sidekick = new AEMSidekick(defaultSidekickConfig);
    document.body.appendChild(sidekick);

    sidekick.addEventListener('contextloaded', async () => {
      await expect(sidekick).shadowDom.to.be.accessible();
    });
  });
});
