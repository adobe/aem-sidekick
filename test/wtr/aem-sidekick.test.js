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
/* eslint-disable no-unused-expressions */

import { html } from 'lit';
import { fixture, expect } from '@open-wc/testing';
import { emulateMedia } from '@web/test-runner-commands';
import { recursiveQuery } from './test-utils.js';

// set dark color scheme
await emulateMedia({ colorScheme: 'dark' });

await import('../../src/extension/app/aem-sidekick.js');

describe('AEM Sidekick', () => {
  let element;
  beforeEach(async () => {
    element = await fixture(html`<aem-sidekick></aem-sidekick>`);
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

  it('passes the a11y audit', async () => {
    await expect(element).shadowDom.to.be.accessible();
  });
});
