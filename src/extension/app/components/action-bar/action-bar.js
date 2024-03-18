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

import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('action-bar')
export class ActionBar extends LitElement {
  static styles = css`
    .action-bar {
      display: flex;
      border-radius: var(--spectrum2-sidekick-border-radius);
      color: var(--spectrum-global-color-gray-800);
      background-color: var(--spectrum2-sidekick-background);
      border: 1px solid var(--spectrum2-sidekick-border-color);
      box-shadow: var(--spectrum2-sidekick-box-shadow);
      backdrop-filter: var(--spectrum2-sidekick-backdrop-filter);
      -webkit-backdrop-filter: var(--spectrum2-sidekick-backdrop-filter);
    }
  `;

  render() {
    return html`
      <div class="action-bar">
        <slot></slot>
      </div>
    `;
  }
}
