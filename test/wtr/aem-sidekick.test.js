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
import '../../src/extension/app/aem-sidekick.js';
import { mockFetchEnglishMessagesSuccess } from './fixtures/i18n.js';

// @ts-ignore
window.chrome = chromeMock;

describe('AEM Sidekick', () => {
  let element;
  beforeEach(async () => {
    mockFetchEnglishMessagesSuccess();
    element = await fixture(html`<aem-sidekick></aem-sidekick>`);
  });

  afterEach(() => {
    fetchMock.restore();
  });

  it('renders theme and action-bar', async () => {
    const theme = element.shadowRoot.querySelector('sp-theme');
    expect(theme).to.exist;

    // detect color scheme change
    await emulateMedia({ colorScheme: 'light' });
    // todo: check if color scheme change is getting picked up
    // expect(theme.getAttribute('color')).to.equal('light');

    const actionBar = recursiveQuery(theme, 'action-bar');
    expect(actionBar).to.exist;
  });

  describe('color themes', () => {
    it('renders light theme', async () => {
      await emulateMedia({ colorScheme: 'light' });
      element = await fixture(html`<aem-sidekick></aem-sidekick>`);

      const theme = element.shadowRoot.querySelector('sp-theme');
      expect(theme).to.exist;

      expect(theme.getAttribute('color')).to.equal('light');
    });

    it('renders dark theme', async () => {
      await emulateMedia({ colorScheme: 'dark' });
      element = await fixture(html`<aem-sidekick></aem-sidekick>`);

      const theme = element.shadowRoot.querySelector('sp-theme');
      expect(theme).to.exist;

      // todo: check if color scheme change is getting picked up
      expect(theme.getAttribute('color')).to.equal('dark');
    });
  });

  it('passes the a11y audit', async () => {
    await expect(element).shadowDom.to.be.accessible();
  });
});
