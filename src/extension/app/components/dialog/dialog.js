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

/* eslint-disable max-len */

import { customElement, property, query } from 'lit/decorators.js';
import { html, LitElement } from 'lit';
import { style } from './dialog.css.js';

/**
 * @typedef {import('@spectrum-web-components/dialog/src/DialogWrapper.js').DialogWrapper} DialogWrapper
 */

@customElement('dialog-view')
export class DialogView extends LitElement {
  /**
   * Acts as the heading of the dialog
   * @type {string}
   */
  @property({ reflect: true, type: String })
  accessor headline;

  /**
   * Can the dialog be dismissed?
   * @type {boolean}
   */
  @property({ reflect: true, type: Boolean })
  accessor dismissable;

  /**
   * The dialog wrapper
   * @type {DialogWrapper}
   */
  @query('sp-dialog-wrapper')
  accessor dialogWrapper;

  static get styles() {
    return [style];
  }

  close() {
    this.dialogWrapper.close();
  }

  render() {
    return html`
      <sp-dialog-wrapper
          headline=${this.headline}
          ?dismissable=${this.dismissable}
          underlay
          open
          @close=${() => {
            const event = new Event('close');
            this.dispatchEvent(event);
          }}>
          <slot></slot>
      </sp-dialog-wrapper>
  `;
  }
}
