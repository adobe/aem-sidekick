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

import { customElement, query } from 'lit/decorators.js';
import { LitElement, html } from 'lit';
import { style } from './confirm-container.css.js';
import { EventBus } from '../../utils/event-bus.js';
import { EVENTS } from '../../constants.js';
import { appStore } from '../../store/app.js';

/**
 * The Confirm object type
 * @typedef {import('@Types').Confirm} Confirm
 */

/**
 * Creates an ESC handler.
 * @param {ConfirmContainer} instance The confirm container
 * @returns {EventListener} The ESC handler
 */
function createEscHandler(instance) {
  /**
   * @param {KeyboardEvent} e The keyboard event
   */
  return ({ key }) => {
    if (key === 'Escape') {
      instance.close();
    }
  };
}

/**
 * Confirm container component
 * @element confirm-container
 * @class ConfirmContainer
 */
@customElement('confirm-container')
export class ConfirmContainer extends LitElement {
  /**
   * The confirm underlay
   * @type {HTMLElement}
   */
  @query('sp-underlay')
  accessor underlay;

  /**
   * The confirm container
   * @type {HTMLElement}
   */
  @query('.confirm-container')
  accessor container;

  /**
   * The confirm dialog
   * @type {HTMLElement}
   */
  dialog;

  /**
   * The ESC handler
   * @type {EventListener}
   */
  escHandler;

  static get styles() {
    return [style];
  }

  async connectedCallback() {
    super.connectedCallback();

    EventBus.instance.addEventListener(EVENTS.SHOW_CONFIRM, ({ detail }) => {
      this.renderConfirm(detail);
    });

    this.escHandler = createEscHandler(this);
    document.addEventListener('keyup', this.escHandler);
  }

  async disconnectedCallback() {
    super.disconnectedCallback();

    document.removeEventListener('keyup', this.escHandler);
  }

  onButtonClick(action) {
    console.log('button clicked');
    this.dispatchEvent(
      new Event('close', { bubbles: true, composed: true }),
    );
    if (typeof action === 'function') {
      action();
    }
  }

  close() {
    // this.underlay.removeAttribute('open');
    this.dialog.remove();
  }

  /**
   * Render a conirm dialog.
   */
  renderConfirm(config) {
    if (this.dialog) {
      return;
    }

    // this.underlay.setAttribute('open', 'true');

    this.dialog = document.createElement('sp-alert-dialog');
    this.dialog.textContent = config.message;
    this.dialog.setAttribute('variant', config.destructive ? 'destructive' : 'confirmation');

    this.container.append(this.dialog);

    const confirmHeading = document.createElement('h2');
    confirmHeading.setAttribute('slot', 'heading');
    confirmHeading.textContent = appStore.i18n('delete');
    this.dialog.append(confirmHeading);

    const cancelButton = document.createElement('sp-button');
    cancelButton.textContent = appStore.i18n('cancel');
    cancelButton.setAttribute('id', 'cancelButton');
    cancelButton.setAttribute('slot', 'button');
    cancelButton.setAttribute('variant', 'secondary');
    cancelButton.setAttribute('treatment', 'outline');
    cancelButton.onclick = () => this.onButtonClick();
    this.dialog.append(cancelButton);

    const okButton = document.createElement('sp-button');
    okButton.textContent = config.confirmLabel || appStore.i18n('ok');
    okButton.setAttribute('id', 'okButton');
    okButton.setAttribute('slot', 'button');
    okButton.setAttribute('variant', config.destructive ? 'negative' : 'accent');
    okButton.setAttribute('treatment', 'fill');
    okButton.onclick = () => this.onButtonClick(config.action);
    this.dialog.append(okButton);

    this.addEventListener('close', this.close);
  }

  render() {
    return html`
      <div class="confirm-container"></div>
    `;
  }
}
