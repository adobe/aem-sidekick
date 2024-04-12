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

import { property } from 'lit/decorators.js';
import { html, nothing } from '@spectrum-web-components/base';
import { DialogWrapper as SPDialogWrapper } from '@spectrum-web-components/dialog';
import { ifDefined } from '@spectrum-web-components/base/src/directives.js';
import { style } from './dialog-wrapper.css.js';
import { MODAL_EVENTS } from '../../constants.js';

export class DialogWrapper extends SPDialogWrapper {
  static get styles() {
    return [...super.styles, style];
  }

  /**
   * Is this a negative action?
   * @type {boolean}
   */
  @property({ type: Boolean })
  accessor negative;

  firstUpdated() {
    if (this.underlay && this.closeOnUnderlayClick) {
      this.shadowRoot.querySelector('sp-underlay').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.dispatchEvent(new CustomEvent(MODAL_EVENTS.CLOSE));
        this.remove();
      });
    }
  }

  renderDialog() {
    const hideDivider = this.noDivider || !this.headline || this.headlineVisibility === 'none';

    return html`
      <sp-dialog
        ?dismissable=${this.dismissable}
        ?no-divider=${hideDivider}
        ?error=${this.error}
        mode=${ifDefined(this.mode)}
        size=${ifDefined(this.size)}
      >
        ${this.hero
          ? html`
              <img
                src="${this.hero}"
                slot="hero"
                aria-hidden=${ifDefined(this.heroLabel ? undefined : 'true')}
                alt=${ifDefined(this.heroLabel ? this.heroLabel : undefined)}
              />
            `
          : nothing}
        ${this.headline
          ? html`
              <h2 slot="heading" ?hidden=${this.headlineVisibility === 'none'}>
                ${this.headline}
              </h2>
            `
          : nothing}
        <slot></slot>
        ${this.footer
          ? html` <div slot="footer">${this.footer}</div> `
          : nothing}
        ${this.cancelLabel
          ? html`
              <sp-button
                variant="secondary"
                treatment="outline"
                slot="button"
                @click=${this.clickCancel}
              >
                ${this.cancelLabel}
              </sp-button>
            `
          : nothing}
        ${this.secondaryLabel
          ? html`
              <sp-button
                variant="primary"
                treatment="outline"
                slot="button"
                @click=${this.clickSecondary}
              >
                ${this.secondaryLabel}
              </sp-button>
            `
          : nothing}
        ${this.confirmLabel
          ? html`
              <sp-button
                variant=${this.negative ? 'negative' : 'accent'}
                slot="button"
                @click=${this.clickConfirm}
              >
                ${this.confirmLabel}
              </sp-button>
            `
          : nothing}
      </sp-dialog>
    `;
  }
}

customElements.define('sp-dialog-wrapper', DialogWrapper);
