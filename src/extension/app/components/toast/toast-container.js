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

import { customElement, query, property } from 'lit/decorators.js';
import { html, LitElement } from 'lit';
import { style } from './toast-container.css.js';

/**
 * The Toast object type
 * @typedef {import('@Types').Toast} Toast
 */

/**
 * Toast container component
 * @element toast-container
 * @class ToastContainer
 * @fires closed
 */
@customElement('toast-container')
export class ToastContainer extends LitElement {
  /**
   * Active toast object
   * @type {Toast}
   */
  @property({ type: Object })
  accessor toast;

  /**
   * The toast container HTMLElement
   * @type {HTMLElement}
   */
  @query('.toast-container')
  accessor toastContainer;

  /**
  * Toast action label
  * @type {string}
  */
  @property({ type: String, attribute: 'action-label' })
  accessor actionLabel;

  /**
  * Action
  * @type {Object}
  */
  @property({ type: Object })
  accessor action;

  static get styles() {
    return [style];
  }

  /**
   * Constructor
   * @param {Toast} toast the toast details
   */
  constructor(toast) {
    super();
    this.toast = toast;
  }

  firstUpdated() {
    this.renderToast(this.toast);
  }

  /**
   * Called when the toast is closed
   */
  onClosed() {
    this.remove();
    this.dispatchEvent(new CustomEvent('closed'));
  }

  /**
     * Render a toast
     * @param {Toast} toast The toast message
     */
  renderToast(toast) {
    const toastElement = document.createElement('sp-toast');
    toastElement.setAttribute('variant', toast.variant);
    toastElement.setAttribute('open', 'true');
    toastElement.setAttribute('timeout', toast.timeout.toString());
    toastElement.textContent = toast.message;
    toastElement.addEventListener('close', this.onClosed.bind(this));

    if (this.actionLabel) {
      toastElement.setAttribute('action-label', this.actionLabel);
    }

    this.toastContainer.append(toastElement);

    toastElement.addEventListener('action', () => {
      this.action();
    });

    toastElement.addEventListener('close', () => {
      this.toastContainer.removeChild(toastElement);
    });
  }

  render() {
    return html`<div class="toast-container"></div>`;
  }
}
