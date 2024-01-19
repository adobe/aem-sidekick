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

import { html } from 'lit';
import { Picker as SPPicker } from '@spectrum-web-components/picker';
import { style } from './picker.css.js';

export class Picker extends SPPicker {
  static get styles() {
    return [
      ...super.styles,
      style,
    ];
  }

  get renderMenu() {
    const menu = html`
        <sp-menu
          aria-labelledby="applied-label"
          @change=${this.handleChange}
          id="menu"
          @keydown=${{
              handleEvent: this.handleEnterKeydown,
              capture: true,
          }}
          role=${this.listRole}
          size=${this.size}
          @sp-menu-item-added-or-updated=${this.shouldManageSelection}
        >
          <slot @slotchange=${this.shouldScheduleManageSelection}></slot>
        </sp-menu>
    `;
    this.hasRenderedOverlay = this.hasRenderedOverlay
        || this.focused
        || this.open
        || !!this.deprecatedMenu;
    if (this.hasRenderedOverlay) {
      return this.renderOverlay(menu);
    }
    return menu;
  }

  render() {
    if (this.tooltipEl) {
      this.tooltipEl.disabled = this.open;
    }
    return html`
      <span
        id="focus-helper"
        tabindex="${this.focused || this.open ? '-1' : '0'}"
        @focus=${this.handleHelperFocus}
        aria-describedby=${DESCRIPTION_ID}
      ></span>
      <button
        aria-controls=${ifDefined(this.open ? 'menu' : undefined)}
        aria-describedby="tooltip"
        aria-expanded=${this.open ? 'true' : 'false'}
        aria-haspopup="true"
        aria-labelledby="icon label applied-label"
        aria-label=${this.label}
        id="button"
        class="button"
        @blur=${this.handleButtonBlur}
        @pointerdown=${this.handleButtonPointerdown}
        @focus=${this.handleButtonFocus}
        @keydown=${{
            handleEvent: this.handleEnterKeydown,
            capture: true,
        }}
        ?disabled=${this.disabled}
        tabindex="-1"
      >
        ${this.buttonContent}
      </button>
      ${this.renderMenu} ${this.renderDescriptionSlot}
    `;
  }
}

customElements.define('action-bar-picker', Picker);
