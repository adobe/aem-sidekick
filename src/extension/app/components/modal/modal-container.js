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

import { customElement, property, queryAsync } from 'lit/decorators.js';
import { LitElement, html } from 'lit';
import { style } from './modal-container.css.js';
import { EventBus } from '../../utils/event-bus.js';
import { MODALS, MODAL_EVENTS } from '../../constants.js';

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
   * The key handler
   * @type {EventListener}
   */
  keyHandler;

  /**
   * The modal Action
   * @type {string}
   */
  @property({ type: String })
  accessor action;

  /**
   * The dialog wrapper
   */
  @queryAsync('sp-dialog-wrapper')
  accessor dialogWrapper;

  static get styles() {
    return [style];
  }

  /**
   * Constructor
   * @param {Modal} modal the modal details
   */
  constructor(modal, appStore) {
    super();

    this.modal = modal;
    this.appStore = appStore;
  }

  async connectedCallback() {
    super.connectedCallback();

    // Listen for ESC or Enter key presses
    this.keyHandler = this.createKeyHandler();
    document.addEventListener('keyup', this.keyHandler);

    // Allow the modal to optionally be closed by an external close event
    EventBus.instance.addEventListener(MODAL_EVENTS.CLOSE, () => {
      this.cleanup();
    });

    // Load bulk result component if needed
    if (this.modal.type === MODALS.BULK_DETAILS) {
      await import('../bulk/bulk-result/bulk-result.js');
    }
  }

  async firstUpdated() {
    const dialogWrapper = await this.dialogWrapper;
    dialogWrapper.addEventListener(MODAL_EVENTS.CLOSE, () => {
      this.remove();
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('keyup', this.keyHandler);
  }

  /**
   * Creates an key press handler.
   * @returns {EventListener} The key handler
   */
  createKeyHandler() {
    /**
     * @param {KeyboardEvent} e The keyboard event
     */
    return ({ key }) => {
      /* istanbul ignore else  */
      if (key === 'Escape') {
        this.onCancel();
      } else if (key === 'Enter') {
        this.onConfirm();
      }
    };
  }

  /**
   * Called when the modal is canceled
   */
  onCancel() {
    this.dispatchEvent(new CustomEvent(MODAL_EVENTS.CANCEL));
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
   * Called when the secondary button is clicked
   */
  onSecondary() {
    // Announces that the "secondary" button has been clicked.
    this.dispatchEvent(new CustomEvent(MODAL_EVENTS.SECONDARY));
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
      case MODALS.ERROR:
        options.dismissable = false;
        options.headline = data?.headline ?? this.appStore.i18n('error');
        options.confirmLabel = data?.confirmLabel ?? this.appStore.i18n('ok');
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
        options.headline = data?.headline ?? this.appStore.i18n('destructive_confirmation').replace('$1', this.action);
        options.confirmLabel = data?.confirmLabel ?? this.appStore.i18n('config_delete');
        options.cancelLabel = this.appStore.i18n('cancel');
        options.content = html`
          ${data?.message || ''}
          <div class="prompt">${this.appStore.i18n('destructive_confirmation_prompt').replace('$1', this.action.toUpperCase())}</div>
          <div class="delete-input">
            <sp-textfield id="delete-confirmation"></sp-textfield>
            <sp-help-text variant="negative">${this.appStore.i18n('destructive_confirmation_invalid')}</sp-help-text>
          </div>
        `;
        break;
      case MODALS.CONFIRM:
        options.underlay = true;
        options.headline = data?.headline ?? this.appStore.i18n('confirm');
        options.confirmLabel = data?.confirmLabel ?? this.appStore.i18n('ok');
        options.cancelLabel = this.appStore.i18n('cancel');
        options.content = html`${data?.message || ''}`;
        break;
      case MODALS.BULK_DETAILS:
        options.underlay = true;
        options.headline = data?.headline ?? this.appStore.i18n('bulk_result_details');
        options.confirmLabel = data?.confirmLabel;
        options.confirmCallback = data?.confirmCallback
          ? () => {
            data.confirmCallback();
            this.onConfirm();
          }
          : undefined;
        options.secondaryLabel = data?.secondaryLabel;
        options.secondaryCallback = data?.secondaryCallback
          ? () => {
            data.secondaryCallback();
            this.onSecondary();
          }
          : undefined;
        options.cancelLabel = this.appStore.i18n('close');
        options.content = html`<bulk-result data-details="${data?.message || '[]'}"></bulk-result>`;
        break;
      default:
        this.cleanup();
        return html``;
    }

    return html`
        <sp-dialog-wrapper
            open
            class=${type}
            headline=${options.headline}
            confirm-label=${options.confirmLabel}
            cancel-label=${options.cancelLabel}
            secondary-label=${options.secondaryLabel}
            .dismissable=${options.dismissable}
            .negative=${options.negative}
            .underlay=${options.underlay}
            .closeOnUnderlayClick=${options.closeOnUnderlayClick}
            .error=${options.error}
            @confirm=${options.confirmCallback || this.onConfirm}
            @secondary=${options.secondaryCallback || this.onSecondary}
            @cancel=${this.onCancel}>
            ${options.content}
        </sp-dialog-wrapper>
      `;
  }

  render() {
    return this.renderModal(this.modal);
  }
}
