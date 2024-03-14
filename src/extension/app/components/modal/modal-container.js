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

/* eslint-disable wc/no-constructor-params */

import { customElement, property } from 'lit/decorators.js';
import { html, LitElement } from 'lit';
import { style } from './modal-container.css.js';
import { EventBus } from '../../utils/event-bus.js';
import { EVENTS, MODALS, MODAL_EVENTS } from '../../constants.js';
import { appStore } from '../../store/app.js';

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

  /**
   * The modal Action
   * @type {string}
   */
  @property({ type: String })
  accessor action;

  static get styles() {
    return [style];
  }

  /**
   * Constructor
   * @param {Modal} modal the modal details
   */
  constructor(modal) {
    super();

    this.modal = modal;
  }

  async connectedCallback() {
    super.connectedCallback();

    // Allow the modal to optionally be closed by an external close event
    EventBus.instance.addEventListener(EVENTS.CLOSE_MODAL, () => {
      this.cleanup();
    });
  }

  /**
   * Called when the modal is canceled
   */
  onCancel() {
    this.dispatchEvent(new CustomEvent(MODAL_EVENTS.CANCELLED));
    this.cleanup();
  }

  /**
   * Called when the confirm button is clicked
   */
  onConfirm() {
    if (this.modal.type === MODALS.DELETE) {
      /**
       * @type {HTMLInputElement}
       */
      const deleteConfirmation = this.shadowRoot.querySelector('#delete-confirmation');
      if (deleteConfirmation.value !== this.action.toUpperCase()) {
        const deleteInput = this.shadowRoot.querySelector('.delete-input');
        deleteInput.classList.add('invalid');
        return;
      }
    }
    // Announces that the "confirm" button has been clicked.
    this.dispatchEvent(new CustomEvent(MODAL_EVENTS.CONFIRM));
    this.cleanup();
  }

  /**
   * Cleanup the modal
   */
  cleanup() {
    this.modal = undefined;
    this.remove();
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
        options.headline = data?.headline ?? appStore.i18n('error');
        options.confirmLabel = data?.confirmLabel ?? appStore.i18n('ok');
        options.content = html`
          ${data.message}
        `;
        break;
      case MODALS.DELETE:
        // eslint-disable-next-line no-case-declarations
        this.action = data?.action ?? 'delete';
        options.negative = true;
        options.underlay = true;
        options.error = true;
        options.headline = data?.headline ?? appStore.i18n('destructive_confirmation').replace('$1', this.action);
        options.confirmLabel = data?.confirmLabel ?? appStore.i18n('config_delete');
        options.cancelLabel = appStore.i18n('cancel');
        options.content = html`
          <div class="prompt">${appStore.i18n('destructive_confirmation_prompt').replace('$1', this.action.toUpperCase())}</div>
          <div class="delete-input">
            <sp-textfield id="delete-confirmation" prompt=${this.action.toUpperCase()}></sp-textfield>
            <sp-help-text variant="negative">${appStore.i18n('destructive_confirmation_invalid')}</sp-help-text>
          </div>
        `;
        break;
      default:
        this.cleanup();
        return html``;
    }

    return html`
        <sp-dialog-wrapper
            open
            headline=${options.headline}
            confirm-label=${options.confirmLabel}
            cancel-label=${options.cancelLabel}
            secondary-label=${options.secondaryLabel}
            .dismissable=${options.dismissable}
            .negative=${options.negative}
            .underlay=${options.underlay}
            .error=${options.error}
            @confirm=${this.onConfirm}
            @cancel=${this.onCancel}>
            ${options.content}
        </sp-dialog-wrapper>
      `;
  }

  render() {
    return this.renderModal(this.modal);
  }
}
