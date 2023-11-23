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

export class ActionBar extends LitElement {
  static styles = css`
    .action-bar {
      display: flex;
      border-radius: 8px;
      color: var(--spectrum-global-color-gray-800);
      background-color: var(--spectrum-global-color-gray-200);
      border: 1px solid var(--spectrum-global-color-gray-300);
    }

    .action-bar sp-action-group {
      padding: 8px;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
  }

  render() {
    return html`
      <div class="action-bar">
        <sp-action-group>
            <sp-action-button quiet>
                <sp-icon-play slot="icon"></sp-icon-play>
            </sp-action-button>
            <sp-action-button quiet>
                <sp-icon-edit slot="icon"></sp-icon-edit>
            </sp-action-button>
            <sp-action-button quiet>
                <sp-icon-refresh slot="icon"></sp-icon-refresh>
            </sp-action-button>
        </sp-action-group>
        <sp-divider size="s" vertical></sp-divider>
        <sp-action-group>
            <sp-action-button quiet>
                <sp-icon-share slot="icon"></sp-icon-share>
            </sp-action-button>
        </sp-action-group>
        <sp-divider size="s" vertical></sp-divider>
        <sp-action-group>
            <sp-action-button quiet>
                <sp-icon-real-time-customer-profile slot="icon"></sp-icon-real-time-customer-profile>
            </sp-action-button>
        </sp-action-group>
      </div>
    `;
  }
}

window.customElements.define('action-bar', ActionBar);
