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

import { html } from '@spectrum-web-components/base';
import { queryAsync, state } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { when } from 'lit/directives/when.js';
import { style } from './onboarding-dialog.css.js';
import { ConnectedElement } from '../connected-element/connected-element.js';
import { ICONS } from '../../constants.js';

/**
 * @typedef {import('@spectrum-web-components/tabs').Tabs} Tabs
 */

/**
 * @typedef {import('@spectrum-web-components/dialog').DialogBase} DialogBase
 */

const TOOLS_ORIGIN = 'https://tools.aem.live';

export class OnBoardingDialog extends ConnectedElement {
  /**
   * @type {Promise<Tabs>}
   */
  @queryAsync('sp-tabs')
  accessor tabs;

  /**
   * @type {Promise<DialogBase>}
   */
  @queryAsync('sp-dialog-base')
  accessor dialog;

  @state()
  accessor selectedIndex = 0;

  @state()
  accessor items;

  @state()
  accessor theme;

  static get styles() {
    return [style];
  }

  async connectedCallback() {
    super.connectedCallback();
    this.fetchIndex();
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', this.onThemeChange);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', this.onThemeChange);
  }

  onThemeChange = () => {
    this.requestUpdate();
  };

  async fetchIndex() {
    const resp = await fetch(`${TOOLS_ORIGIN}/sidekick/query-index.json`);
    if (resp.ok) {
      const index = await resp.json();
      const promises = index.data.map((item) => (item.category === 'onboarding' ? item : null))
        .map(async (item) => {
          const fetchResp = await fetch(`${TOOLS_ORIGIN}${item.path}.plain.html`);
          if (fetchResp.ok) {
            return {
              ...item,
              content: await fetchResp.text(),
            };
          }

          return null;
        });

      this.items = await Promise.all(promises);

      const imagePromises = this.items.map(async (url) => {
        const response = await fetch(url);
        const blob = await response.blob();
        const img = new Image();
        img.src = URL.createObjectURL(blob);
        // Optionally, append the image to the DOM (hidden) to ensure it's loaded
        // document.body.appendChild(img);
      });

      await Promise.all(imagePromises);
    }
  }

  async onTabChange(e) {
    this.selectedIndex = Number(e.target.value);
    this.requestUpdate();
    console.log('index', this.selectedIndex);
  }

  async onNextClicked() {
    this.selectedIndex += 1;
    if (this.selectedIndex >= this.items.length) {
      this.closeDialog();
    }
    console.log('index', this.selectedIndex);
  }

  async closeDialog() {
    console.log('closeDialog');
    this.remove();
  }

  renderCurrentIndex() {
    const main = document.createElement('main');
    main.innerHTML = this.items[this.selectedIndex].content;

    // reset base path for media to fragment base
    const resetAttributeBase = (tag, attr) => {
      main.querySelectorAll(`${tag}[${attr}^="./media_"]`).forEach((elem) => {
        elem[attr] = new URL(elem.getAttribute(attr), new URL(TOOLS_ORIGIN)).href;
      });
    };
    resetAttributeBase('img', 'src');
    resetAttributeBase('source', 'srcset');

    return unsafeHTML(main.innerHTML);
  }

  render() {
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = prefersDarkMode ? 'dark' : 'light';
    return html`
      ${when(this.items && this.items.length > 0,
        () => html`
          <sp-dialog-base slot="click-content" open underlay>
            <div class="container">
              <nav>
                <div class="heading">What's New</div>
                <sp-tabs quiet direction="vertical" selected=${this.selectedIndex}>
                  ${this.items.map((item, index) => html`<sp-tab label=${item.title} value=${index} @click=${this.onTabChange}></sp-tab>`)}
                </sp-tabs>
              </nav>
              <div>
                <div class="content">${this.renderCurrentIndex()}</div>
                <sp-button
                    variant="cta"
                    treatment="fill"
                    @click=${this.onNextClicked}
                >
                    ${this.selectedIndex === this.items.length - 1 ? 'Close' : 'Next'}
                </sp-button>
              </div>
            </div>
            <sp-button id="close-button" static=${theme === 'dark' ? 'black' : 'white'} label="Close" @click=${this.closeDialog} icon-only>
              <sp-icon slot="icon" size="m">
                ${ICONS.CLOSE_X}
              </sp-icon>
            </sp-button>
          </sp-dialog-base>
      `)}`;
  }
}

customElements.define('onboarding-dialog', OnBoardingDialog);
