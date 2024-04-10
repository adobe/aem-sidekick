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

// @ts-nocheck
/* istanbul ignore file */

import { css } from 'lit';
import { html } from '@spectrum-web-components/base';
import { Toast as SPToast } from '@spectrum-web-components/toast';
import { ICONS } from '../../constants.js';

export class Toast extends SPToast {
  static get styles() {
    return [
      ...super.styles,
      css`
        .buttons {
          gap: 10px;
        }

        .buttons sp-action-button {
          height: 100%;
          color: #fff;
          background-color: #fff2;
          border-radius: 16px;
          min-width: 65px;
        }

        .buttons sp-action-button:hover {
          background-color: #fff4;
        }

        .buttons sp-action-button:active {
          background-color: #fff2;
        }
      `,
    ];
  }

  renderIcon(variant) {
    switch (variant) {
      case 'info':
        return html`<sp-icon class="type" size="s">${ICONS.INFO}</sp-icon>`;
      case 'negative':
      case 'error': // deprecated
      case 'warning': // deprecated
        return html`
          <sp-icon-alert label="Error" class="type"></sp-icon-alert>
        `;
      case 'positive':
      case 'success':
        return html`<sp-icon class="type" size="s">${ICONS.CHECKMARK}</sp-icon>`;
      default:
        return html``;
    }
  }

  renderActionButton() {
    const label = this.getAttribute('action-label');
    if (!this.action && label) {
      return html`
        <sp-action-button
            @click=${() => this.dispatchEvent(new CustomEvent('action', { bubbles: true }))}
            quiet
            variant="primary"
            size="s"
            class="action"
        >
          ${label}
        </sp-action-button>
    `;
    }

    return html``;
  }

  render() {
    return html`
        ${this.renderIcon(this.variant)}
        <div class="body" role="alert">
            <div class="content">
                <slot></slot>
            </div>
            <slot name="action"></slot>
        </div>
        <div class="buttons">
            ${this.renderActionButton()}
            <sp-close-button
                @click=${this.shouldClose}
                label="Close"
                static="white"
            ></sp-close-button>
        </div>
    `;
  }
}

customElements.define('sp-toast', Toast);
