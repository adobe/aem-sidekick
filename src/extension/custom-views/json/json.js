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
import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import '@spectrum-web-components/theme/scale-medium.js';
import '@spectrum-web-components/theme/theme-dark.js';
import '@spectrum-web-components/theme/theme-light.js';
import '@spectrum-web-components/theme/sp-theme.js';

@customElement('json-view')
export class JSONView extends LitElement {
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
        theme="spectrum"
        color=${this.theme === 'dark' ? 'dark' : 'light'}
        scale="medium"
      >
        <div>HI</div>
      </sp-theme>
    `;
  }
}
