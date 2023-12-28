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

import { customElement, query } from 'lit/decorators.js';
import { html, LitElement } from 'lit';
import { style } from './toast-container.css.js';
import { EventBus } from '../../utils/event-bus.js';
import { EVENTS } from '../../constants.js';

/**
 * The plugin object type
 * @typedef {import('@Types').Toast} Toast
 */

@customElement('toast-container')
export class ModalContainer extends LitElement {
    /**
     * The toast container HTMLElement
     * @type {HTMLElement}
     */
    @query('.toast-container')
    accessor toastContainer;

    static get styles() {
      return [style];
    }

    async connectedCallback() {
      super.connectedCallback();

      EventBus.instance.addEventListener(EVENTS.SHOW_TOAST, (e) => {
        this.renderToast(e.detail);
      });
    }

    /**
     * Render a toast
     * @param {Toast} toast The toast message
     */
    renderToast(toast) {
      if (this.toastContainer.childElementCount === 0) {
        const toastElement = document.createElement('sp-toast');
        toastElement.setAttribute('variant', toast.variant);
        toastElement.setAttribute('open', 'true');
        toastElement.setAttribute('timeout', toast.timeout);
        toastElement.textContent = toast.message;
        this.toastContainer.append(toastElement);

        toastElement.addEventListener('close', () => {
          this.toastContainer.removeChild(toastElement);
        });
      }
    }

    render() {
      return html`<div class="toast-container"></div>`;
    }
}
