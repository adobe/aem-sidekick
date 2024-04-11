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
import { reaction } from 'mobx';
import { ICONS, SidekickState } from '../../../constants.js';
import { appStore } from '../../../store/app.js';

@customElement('activity-action')
export class ActivityAction extends LitElement {
  static styles = css`
    :host {
      width: 100%;
    }

    .container {
      display: flex;
      align-items: center;
      height: 100%;
      gap: 12px;
    }

    .container span {
      padding-bottom: 2px;
    }

    .toast-container {
      color: #fff;
      display: flex;
      align-items: center;
      flex-direction: row;
      width: 100%;
    }

    .toast-container .message {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-grow: 1;
    }

    .toast-container .actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .toast-container .actions sp-action-button {
      color: #fff;
      border-radius: 16px;
      --highcontrast-actionbutton-background-color-hover: #fff4;
      --highcontrast-actionbutton-background-color-active: #fff2;
    }

    .toast-container .actions sp-action-button.close {
      color: #fff;
    }

    .toast-container .actions sp-action-button.action {
      --highcontrast-actionbutton-background-color-default: #fff2;
      height: 100%;
      min-height: 32px;
      min-width: 65px;
      padding-bottom: 2px;
    }
  `;

  /**
   * Listen for state changes
   */
  async connectedCallback() {
    super.connectedCallback();

    reaction(
      () => appStore.state,
      () => {
        this.requestUpdate();
      },
    );
  }

  renderType() {
    switch (appStore.state) {
      case SidekickState.FETCHING_STATUS:
      case SidekickState.LOGGING_IN:
      case SidekickState.LOGGING_OUT:
      case SidekickState.PREVIEWING:
      case SidekickState.PUBLISHNG:
      case SidekickState.UNPUBLISHING:
      case SidekickState.DELETING:
        return html`
          <sp-progress-circle size="s" indeterminate></sp-progress-circle><span>${appStore.i18n(appStore.state)}</span>
        `;
      case SidekickState.LOGIN_REQUIRED:
        return html`
          ${ICONS.INFO}<span>${appStore.i18n(appStore.state)}</span>
        `;
      case SidekickState.UNAUTHORIZED:
        return html`
          ${ICONS.ALERT_TRIANGLE}<span>${appStore.i18n(appStore.state)}</span>
        `;
      case SidekickState.TOAST:
        return html`
          <div class="toast-container">
            <div class="message">
              ${ICONS.CHECKMARK}<span>${appStore.toast.message}</span>
            </div>
            <div class="actions">
              ${appStore.toast.actionCallback && appStore.toast.actionLabel ? html`
                <sp-action-button class="action" quiet @click=${appStore.toast.actionCallback}>
                  ${appStore.toast.actionLabel}
                </sp-action-button>
              ` : html``}
              <sp-action-button class="close" quiet @click=${appStore.toast.closeCallback}>
                <sp-icon slot="icon">${ICONS.CLOSE_X}</sp-icon>
              </sp-action-button>
            </div>
          </div>
        `;
      default:
        return html``;
    }
  }

  render() {
    return html`
      <div class="container">
        ${this.renderType()}
      </div>
    `;
  }
}
