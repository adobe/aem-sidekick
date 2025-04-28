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

import { html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { reaction } from 'mobx';
import { ICONS, STATE } from '../../../constants.js';
import { ConnectedElement } from '../../connected-element/connected-element.js';
import { style } from './activity-action.css.js';

@customElement('activity-action')
export class ActivityAction extends ConnectedElement {
  static get styles() {
    return [style];
  }

  /**
   * Listen for state changes
   */
  async connectedCallback() {
    super.connectedCallback();

    reaction(
      () => this.appStore.state,
      () => {
        this.requestUpdate();
      },
    );

    reaction(
      () => this.appStore.bulkStore.progress,
      () => {
        this.requestUpdate();
      },
    );
  }

  handleCloseToast() {
    this.appStore.closeToast();
  }

  getToastIcon() {
    switch (this.appStore.toast.variant) {
      case 'positive':
        return ICONS.CHECKMARK;
      case 'negative':
      case 'warning':
        return ICONS.ALERT_TRIANGLE;
      case 'info':
        return ICONS.INFO;
      /* istanbul ignore next */
      default:
        return ICONS.INFO;
    }
  }

  renderType() {
    switch (this.appStore.state) {
      case STATE.FETCHING_STATUS:
      case STATE.LOGGING_IN:
      case STATE.LOGGING_OUT:
      case STATE.PREVIEWING:
      case STATE.PUBLISHNG:
      case STATE.UNPUBLISHING:
      case STATE.DELETING:
      case STATE.CONFIG:
        return html`
          <sp-progress-circle size="s" indeterminate></sp-progress-circle><span>${this.appStore.i18n(this.appStore.state)}</span>
        `;
      case STATE.BULK_PREVIEWING:
      case STATE.BULK_PUBLISHING:
        return html`
          <sp-progress-circle size="s" indeterminate></sp-progress-circle>
          <span>
            ${this.appStore.bulkStore?.progress
              ? this.appStore.i18n(this.appStore.state)
                  .replace('$1', `${this.appStore.bulkStore.progress.processed}`)
                  .replace('$2', `${this.appStore.bulkStore.progress.total}`)
              // show generic state if bulk progress not available
              : this.appStore.i18n(this.appStore.state.replace('bulk_', ''))}
          </span>
        `;
      case STATE.LOGIN_REQUIRED:
        return html`
          ${ICONS.INFO}<span>${this.appStore.i18n(this.appStore.state)}</span>
        `;
      case STATE.UNAUTHORIZED:
        return html`
          ${ICONS.ALERT_TRIANGLE}<span>${this.appStore.i18n(this.appStore.state)}</span>
        `;
      case STATE.CODE:
        return html`
          ${ICONS.CODE_ICON}<span>${this.appStore.i18n(this.appStore.state)}</span>
        `;
      case STATE.MEDIA:
        return html`
          ${ICONS.MEDIA_ICON}<span>${this.appStore.i18n(this.appStore.state)}</span>
        `;
      case STATE.TOAST:
        return html`
          <div class="toast-container">
            <div class="message">
              ${this.getToastIcon()}<span>${this.appStore.toast.message}</span>
            </div>
            <div class="actions">
              ${this.appStore.toast.secondaryCallback && this.appStore.toast.secondaryLabel ? html`
                <sp-action-button class="action" quiet @click=${this.appStore.toast.secondaryCallback}>
                  ${this.appStore.toast.secondaryLabel}
                </sp-action-button>
              ` : html``}
              ${this.appStore.toast.actionCallback && this.appStore.toast.actionLabel ? html`
                <sp-action-button class="action" quiet @click=${this.appStore.toast.actionCallback}>
                  ${this.appStore.toast.actionLabel}
                </sp-action-button>
              ` : html``}
              <sp-action-button class="close" quiet @click=${this.handleCloseToast}>
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
