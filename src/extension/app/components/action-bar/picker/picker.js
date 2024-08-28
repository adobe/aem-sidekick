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

import { html } from '@spectrum-web-components/base';
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

  handleBeforetoggle(event) {
    if (event.composedPath()[0] !== event.target) {
      return;
    }
    if (event.newState === 'closed') {
      if (this.preventNextToggle === 'no') {
        this.open = false;
      } else if (!this.pointerdownState) {
        // Prevent browser driven closure while opening the Picker
        // and the expected event series has not completed.
        this.overlayElement?.manuallyKeepOpen();
      }
    }
    if (!this.open && this.optionsMenu) {
      this.optionsMenu.updateSelectedItemIndex();
      this.optionsMenu.closeDescendentOverlays();
    }
  }

  renderOverlay(menu) {
    const container = this.renderContainer(menu);
    this.dependencyManager.add('sp-overlay');

    if (!this.dependencyManager.loaded || !this.open) {
      return html``;
    }
    return html`
        <sp-overlay
            @slottable-request=${this.handleSlottableRequest}
            @beforetoggle=${this.handleBeforetoggle}
            .triggerElement=${this}
            .offset=${0}
            .open=${this.open && this.dependencyManager.loaded}
            .placement=${this.isMobile.matches ? undefined : this.placement}
            .type=${this.isMobile.matches ? 'modal' : 'auto'}
            .receivesFocus=${'true'}
            .willPreventClose=${this.preventNextToggle !== 'no'
            && this.open
            && this.dependencyManager.loaded}
        >
            ${container}
        </sp-overlay>
    `;
  }
}

customElements.define('action-bar-picker', Picker);
