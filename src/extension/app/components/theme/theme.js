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

/* eslint-disable wc/no-constructor-params, wc/guard-super-call */

import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('theme-wrapper')
export class ThemeWrapper extends LitElement {
  static properties = {
    theme: { type: String },
  };

  constructor() {
    super();
    this.theme = 'light';
  }

  async connectedCallback() {
    super.connectedCallback();

    this.getTheme();

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', this.onChange);
  }

  onChange = () => {
    /* istanbul ignore next */
    this.getTheme();
  };

  disconnectedCallback() {
    super.disconnectedCallback();

    window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', this.onChange);
  }

  getTheme() {
    this.theme = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  render() {
    return html`
      <sp-theme
        theme="express"
        color=${this.theme === 'dark' ? 'dark' : 'light'}
        scale="medium"
      >
        <slot></slot>
      </sp-theme>
    `;
  }
}
