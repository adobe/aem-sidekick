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

/* eslint-disable no-promise-executor-return */

import { customElement, property, queryAsync } from 'lit/decorators.js';
import { html, css } from 'lit';
import { EventBus } from '../../utils/event-bus.js';
import { EVENTS, ICONS } from '../../constants.js';
import sampleRUM from '../../../utils/rum.js';
import { ConnectedElement } from '../connected-element/connected-element.js';

/**
 * The modal type
 * @typedef {import('@Types').CustomPlugin} CustomPlugin
 */

/**
 * The lit template result type
 * @typedef {import('lit').TemplateResult} TemplateResult
 */

/**
 * Plugin palette container component
 * @element palette-container
 * @class PaletteContainer
 */
@customElement('palette-container')
export class PaletteContainer extends ConnectedElement {
  /**
   * Active plugin object
   * @type {CustomPlugin}
   */
  @property({ type: Object })
  accessor plugin;

  @queryAsync('.container')
  accessor container;

  static styles = css`
    .container {
      position: absolute;
      background-color: var(--mod-popover-background-color);
      color: var(--spectrum-gray-800);
      backdrop-filter: var(--sidekick-backdrop-filter);
      border-top-left-radius: var(--mod-popover-corner-radius);
      border-top-right-radius: var(--mod-popover-corner-radius);
      pointer-events: auto;
      overflow: hidden;
      padding-bottom: 20px;
    }

    .container.hidden {
      display: none;
    }

    .container .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px;
    }

    .container .header .title {
      font-size: 16px;
      font-weight: 600;
    }

    .container .header .close {
      --mod-actionbutton-border-radius: 50%;
    }

    .container iframe {
      border: 0;
      overflow: hidden;
    }
  `;

  async connectedCallback() {
    super.connectedCallback();

    EventBus.instance.addEventListener(EVENTS.OPEN_PALETTE, async (e) => {
      const newPlugin = e.detail.plugin;

      this.showContainer();

      if (newPlugin.id !== this.plugin?.id) {
        // Reset the iframe src to avoid seeing the old plugin
        const iframe = this.shadowRoot.querySelector('iframe');
        if (iframe) {
          this.plugin = undefined;

          // Wait for next tick for the to iframe reset
          await new Promise((resolve) => setTimeout(resolve, 0));
          this.plugin = e.detail.plugin;
          this.requestUpdate();

          return;
        }
      }

      this.plugin = e.detail.plugin;
    });

    this.addEventListener('keydown', this.onKeyDown);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('keydown', this.onKeyDown);
  }

  /**
   * Show the palette container
   */
  async showContainer() {
    const paletteContainer = await this.container;
    if (paletteContainer) {
      paletteContainer.classList.remove('hidden');
    }
  }

  /**
   * Hide the palette container
   */
  async hideContainer() {
    const paletteContainer = await this.container;
    if (paletteContainer) {
      paletteContainer.classList.add('hidden');
    }
  }

  /**
   * Check for keyboard event
   * @param {KeyboardEvent} event Keyboard event
   */
  onKeyDown(event) {
    if (event.key === 'Escape') {
      this.plugin = undefined;
    }
  }

  /**
   * Called when the modal is closed
   */
  async closed() {
    this.hideContainer();
    sampleRUM('sidekick:paletteclosed', {
      source: this.appStore.location.href,
      target: this.appStore.status.webPath,
    });
  }

  /**
   * Render a modal
   * @param {CustomPlugin | undefined} plugin Plugin object
   * @returns {TemplateResult | undefined} The modal element
   */
  renderPalette(plugin) {
    if (!plugin) {
      return undefined;
    }

    const {
      id,
      paletteRect,
      titleI18n,
      title,
      url,
    } = this.plugin;

    const paletteTitle = (titleI18n && titleI18n[this.appStore.siteStore.lang]) || title;

    return html`
      <div
        id=${`palette-${id}`}
        class="container"
        style=${paletteRect || ''}
        tabindex="0">
        <div class="header">
          <div class="title">${paletteTitle}</div>
          <sk-action-button class="close" quiet @click=${this.closed}>
            <sp-icon slot="icon">${ICONS.CLOSE_X}</sp-icon>
          </sk-action-button>
        </div>
        <sp-divider></sp-divider>
        <iframe width="100%" height="100%" title=${paletteTitle} src=${url} allow="clipboard-write *"></iframe>
      </div>
    `;
  }

  render() {
    return this.renderPalette(this.plugin);
  }
}
