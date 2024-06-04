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

import { html } from 'lit';
import { MenuItem as SPMenuItem } from '@spectrum-web-components/menu';
import { style } from './menu-item.css.js';

class MenuItem extends SPMenuItem {
  static get styles() {
    return [
      ...super.styles,
      style,
    ];
  }

  renderMenuItem() {
    if (this.classList.contains('user')) {
      return html`
        <div class="user-item">
          <div id="image">
            <slot name="icon"></slot>
          </div>
          <div class="info">
            <div id="label">
              <slot id="slot"></slot>
              </div>
            <slot name="description"></slot>
            <slot name="value"></slot>
          </div>
        </div>
      `;
    } else if (this.classList.contains('logout')) {
      return html`
        <div class="logout-item">
          <slot name="icon"></slot>
          <div id="label">
            <slot id="slot"></slot>
          </div>
          <slot name="value"></slot>
        </div>`;
    } else if (this.classList.contains('icon-item')) {
      return html`
        <div class="icon-item">
          <slot name="icon"></slot>
          <div id="label">
            <slot id="slot"></slot>
          </div>
        </div>`;
    }

    return html`
      <slot name="avatar"></slot>
      <div id="label">
          <slot id="slot"></slot>
          <slot name="icon"></slot>
      </div>
      <slot name="description"></slot>
      <slot name="value"></slot>
      ${this.href && this.href.length > 0
          ? super.renderAnchor({
                id: 'button',
                ariaHidden: true,
                className: 'button anchor hidden',
            })
          : ''}
      ${this.getAttribute('update') ? html`<sp-status-light size="m" variant="notice"></sp-status-light>` : ''}
      ${this.renderSubmenu()}
    `;
  }

  render() {
    return this.renderMenuItem();
  }
}

customElements.define('sp-menu-item', MenuItem);
