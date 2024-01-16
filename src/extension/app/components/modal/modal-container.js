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

import { customElement, property } from 'lit/decorators.js';
import { html, LitElement } from 'lit';
import { style } from './modal-container.css.js';
import { EventBus } from '../../utils/event-bus.js';
import { EVENTS, MODALS } from '../../constants.js';
import { appStore } from '../../store/app.js';
import { i18n } from '../../utils/i18n.js';

/**
 * The modal type
 * @typedef {import('@Types').Modal} Modal
 */

/**
 * The lit template result type
 * @typedef {import('lit').TemplateResult} TemplateResult
 */

/**
 * Modal container component
 * @element modal-container
 * @class ModalContainer
 */
@customElement('modal-container')
export class ModalContainer extends LitElement {
  /**
   * Active modal object
   * @type {Modal}
   */
  @property({ type: Object })
  accessor modal;

  static get styles() {
    return [style];
  }

  async connectedCallback() {
    super.connectedCallback();

    EventBus.instance.addEventListener(EVENTS.OPEN_MODAL, (e) => {
      this.modal = e.detail;
    });

    EventBus.instance.addEventListener(EVENTS.CLOSE_MODAL, () => {
      this.modal = undefined;
    });
  }

  /**
   * Called when the modal is closed
   */
  closed() {
    this.modal = undefined;
  }

  /**
   * Render a modal
   * @param {Modal | undefined} modal Modal object
   * @returns {TemplateResult | undefined} The modal element
   */
  renderModal(modal) {
    if (!modal || !modal.type) {
      return undefined;
    }

    const { type, data } = modal;
    const options = {};
    switch (type) {
      case MODALS.WAIT:
        options.dismissable = false;
        options.content = html`
          <div class="wait-dialog">
            <sp-progress-circle label=${data.message} indeterminate></sp-progress-circle>
            <span>${data.message}</span>
          </div>
        `;
        break;
      case MODALS.ERROR:
        options.dismissable = false;
        options.headline = data.headline || i18n(appStore.languageDict, 'error');
        options.confirmLabel = data.confirmLabel || i18n(appStore.languageDict, 'ok');
        options.content = html`
          ${data.message}
        `;
        break;
      default:
        return html``;
    }

    return html`
          <dialog-view
              headline=${options.headline}
              .dismissable=${options.dismissable}
              ?underlay=${options.underlay}
              confirm-label=${options.confirmLabel}
              @close=${this.closed}
              @confirm=${this.closed}
          >
              ${options.content}
          </dialog-view>
      `;
  }

  render() {
    return this.renderModal(this.modal);
  }
}
