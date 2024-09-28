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
      color: var(--spectrum2-sidekick-color));
      background-color: var(--spectrum2-sidekick-background);
      border: 1px solid var(--spectrum2-sidekick-border-color);
      box-shadow: var(--sidekick-box-shadow);
      backdrop-filter: var(--sidekick-backdrop-filter);
      -webkit-backdrop-filter: var(--sidekick-backdrop-filter);
    }

    :host(.positive) .action-bar {
      transition: background-color 500ms;
      background-color: var(--spectrum2-color-positive);
      border: 1px solid var(--spectrum2-color-positive);
    }
    :host(.warning) .action-bar {
      transition: background-color 500ms;
      background-color: var(--spectrum2-color-warning);
      border: 1px solid var(--spectrum2-color-warning);
    }
    :host(.negative) .action-bar {
      transition: background-color 500ms;
      background-color: var(--spectrum2-background-color-negative);
      border: 1px solid var(--spectrum2-background-color-negative);
    }
    :host(.info) .action-bar {
      transition: background-color 500ms;
      background-color: var(--spectrum2-color-info);
      border: 1px solid var(--spectrum2-color-info);
    }

    :host(.positive) slot::slotted(sp-action-group),
    :host(.warning) slot::slotted(sp-action-group),
    :host(.negative) slot::slotted(sp-action-group),
    :host(.info) slot::slotted(sp-action-group) {
        width: 100%;
    }

    @media (max-width: 700px) {
      .action-bar {
        border-radius: 0;
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
