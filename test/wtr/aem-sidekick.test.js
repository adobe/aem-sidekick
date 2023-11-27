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
import { recursiveQuery } from './test-utils.js';

import '../../src/extension/app/aem-sidekick.js';

describe('AEM Sidekick', () => {
  let element;
  beforeEach(async () => {
    element = await fixture(html`<aem-sidekick></aem-sidekick>`);
  });

  it('renders theme and action-bar', () => {
    const theme = element.shadowRoot.querySelector('sp-theme');
    expect(theme).to.exist;

    const actionBar = recursiveQuery(theme, 'action-bar');
    expect(actionBar).to.exist;
  });

  it('passes the a11y audit', async () => {
    await expect(element).shadowDom.to.be.accessible();
  });
});
