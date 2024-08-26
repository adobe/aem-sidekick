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

// @ts-nocheck
/* istanbul ignore file */

import { css, html } from '@spectrum-web-components/base';
import { ActionMenu as SPActionMenu } from '@spectrum-web-components/action-menu';

export class ActionMenu extends SPActionMenu {
  static get styles() {
    return [
      ...super.styles,
      css`
        sp-popover {
          box-shadow: 
            0px 0px 3px rgba(0, 0, 0, 0.12), 
            0px 3px 8px rgba(0, 0, 0, 0.04), 
            0px 4px 16px rgba(0, 0, 0, 0.08);
          backdrop-filter: var(--sidekick-backdrop-filter);
          filter: unset;
        }

        sp-action-button[selected] {
          background-color: rgba(0, 0, 0, 0.05);
          color: var(--spectrum2-action-button-selected);
        }

        sp-menu {
          gap: 4px;
        }

        sp-overlay:not(:defined) {
          display: unset;
        }

        :host([quiet]) sp-action-button {
          --mod-actionbutton-border-color-default: transparent;
          --mod-actionbutton-border-color-hover: transparent;
          --mod-actionbutton-border-color-focus: transparent;
          --mod-actionbutton-background-color-default: transparent;
        }
      `,
    ];
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
    if (!this.dependencyManager.loaded) {
      return html``;
    }

    if (!this.open && !this.focused) {
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

customElements.define('sp-action-menu', ActionMenu);
