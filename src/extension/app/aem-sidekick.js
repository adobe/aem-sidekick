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

/* eslint-disable wc/no-constructor-params */

import { html, LitElement } from 'lit';
import { provide } from '@lit/context';
import { customElement } from 'lit/decorators.js';
import { reaction } from 'mobx';
import { style } from './aem-sidekick.css.js';
import { AppStore, appStoreContext } from './store/app.js';
import {
  ALLOWED_EXTENSION_IDS, EVENTS, EXTERNAL_EVENTS, MODALS,
} from './constants.js';
import { detectBrowser, rectToStyles } from './utils/browser.js';
import { getConfig } from '../config.js';
import { EventBus } from './utils/event-bus.js';

@customElement('aem-sidekick')
export class AEMSidekick extends LitElement {
  /**
   * @type {AppStore}
   */
  @provide({ context: appStoreContext })
  accessor appStore;

  static get styles() {
    return [style];
  }

  constructor(config, store) {
    super();

    this.appStore = store || new AppStore();
    this.loadContext(config);
  }

  async connectedCallback() {
    super.connectedCallback();

    reaction(
      () => this.appStore.theme,
      () => {
        this.requestUpdate();
      },
    );
  }

  async loadContext(config) {
    await this.appStore.loadContext(this, config);

    const browser = detectBrowser(navigator.userAgent);
    this.appStore.sampleRUM('top', {
      source: 'sidekick',
      target: `loaded:${browser}`,
    });

    document.dispatchEvent(new CustomEvent(EXTERNAL_EVENTS.SIDEKICK_READY));

    const onboarded = await getConfig('local', 'onboarded');
    if (!onboarded) {
      this.appStore.showOnboarding();
    }
    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
      if (msg.action === 'show_notification' && ALLOWED_EXTENSION_IDS.includes(sender.id)) {
        const { message, headline } = msg;
        this.appStore.showModal({
          type: MODALS.INFO,
          data: {
            headline,
            message,
            confirmCallback: (response) => { sendResponse(response); },
          },
        });
      } else if (msg.action === 'resize_palette') {
        const { id, rect } = msg;
        EventBus.instance.dispatchEvent(new CustomEvent(EVENTS.RESIZE_PALETTE, {
          detail: { id, styles: rectToStyles(rect) },
        }));
        sendResponse(true);
      } else if (msg.action === 'resize_popover') {
        const { id, rect } = msg;
        EventBus.instance.dispatchEvent(new CustomEvent(EVENTS.RESIZE_POPOVER, {
          detail: { id, styles: rectToStyles(rect) },
        }));
        sendResponse(true);
      } else if (msg.action === 'close_palette') {
        EventBus.instance.dispatchEvent(new CustomEvent(EVENTS.CLOSE_PALETTE, {
          detail: { id: msg.id },
        }));
        sendResponse(true);
      } else if (msg.action === 'close_popover') {
        EventBus.instance.dispatchEvent(new CustomEvent(EVENTS.CLOSE_POPOVER, {
          detail: { id: msg.id },
        }));
        sendResponse(true);
      }
      return true;
    });
  }

  /**
   * Allow the location the sidekick is working with the be accessed via
   * the aem-sidekick element.
   * @returns {URL}
   */
  get location() {
    return this.appStore.location;
  }

  render() {
    return html`
      <theme-wrapper theme=${this.appStore.theme}>
        <plugin-action-bar></plugin-action-bar>
        <palette-container></palette-container>
      </theme-wrapper>
    `;
  }
}
