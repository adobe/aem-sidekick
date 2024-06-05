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

import { customElement, property } from 'lit/decorators.js';
import { html, css } from 'lit';
import { EventBus } from '../../utils/event-bus.js';
import { EVENTS } from '../../constants.js';
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

  static styles = css`
    palette-dialog-wrapper iframe {
      border: 0;
    }
  `;

  async connectedCallback() {
    super.connectedCallback();

    EventBus.instance.addEventListener(EVENTS.OPEN_PALETTE, (e) => {
      this.plugin = e.detail.plugin;
    });

    this.addEventListener('keydown', this.onKeyDown);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('keydown', this.onKeyDown);
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
  closed() {
    this.plugin = undefined;
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
      <palette-dialog-wrapper
        id=${`palette-${id}`}
        headline=${paletteTitle}
        hero-label="ABC"
        style=${paletteRect || ''}
        no-divider
        dismissable
        open
        @close=${this.closed}
        tabindex="0">
        <iframe width="100%" height="100%" title=${paletteTitle} src=${url} allow="clipboard-write *"></iframe>
      </palette-dialog-wrapper>
    `;
  }

  render() {
    return this.renderPalette(this.plugin);
  }
}
