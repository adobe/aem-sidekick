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
import { html, nothing } from '@spectrum-web-components/base';
import { ifDefined } from '@spectrum-web-components/base/src/directives.js';
import { DialogWrapper } from '@spectrum-web-components/dialog';

export class PaletteDialogWrapper extends DialogWrapper {
  static get styles() {
    return [
      ...super.styles,
      css`
        :host {
          --mod-modal-background-color: transparent;
          --mod-modal-confirm-border-radius: var(--spectrum2-sidekick-border-radius);
          --spectrum-modal-max-width: 100%;
          --mod-dialog-confirm-padding-grid: 0;
          --mod-dialog-confirm-description-padding: 0;
        }

        .modal {
          background-color: var(--spectrum2-sidekick-background);
          backdrop-filter: var(--sidekick-backdrop-filter);
          -webkit-backdrop-filter: var(--sidekick-backdrop-filter);
          overflow: hidden;
        }

        h2 {
          display: flex;
          align-items: center;
          height: 100%;
          padding-left: 12px;
        }

        .modal {
          width: 100%;
          height: 100%;
        }

        .modal palette-dialog {
          width: 100%;
          height: 100%;
        }
      `,
    ];
  }

  get dialog() {
    return this.shadowRoot.querySelector('palette-dialog');
  }

  renderDialog() {
    const hideDivider = this.noDivider
        || !this.headline
        || this.headlineVisibility === 'none';

    return html`
      <palette-dialog
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
                aria-hidden=${ifDefined(
                  this.heroLabel ? undefined : 'true',
                )}
                alt=${ifDefined(
                  this.heroLabel ? this.heroLabel : undefined,
                )}
              />
            `
          : nothing}
        ${this.headline
          ? html`
              <h2
                slot="heading"
                ?hidden=${this.headlineVisibility === 'none'}
              >
                ${this.headline}
              </h2>
            `
          : nothing}
        <slot></slot>
        ${this.footer
          ? html`
              <div slot="footer">${this.footer}</div>
            `
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
                variant="accent"
                slot="button"
                @click=${this.clickConfirm}
              >
                ${this.confirmLabel}
              </sp-button>
            `
          : nothing}
      </palette-dialog>
    `;
  }
}

customElements.define('palette-dialog-wrapper', PaletteDialogWrapper);
