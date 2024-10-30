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
import { getConfig, setConfig } from '../../../config.js';
import { getLanguage } from '../../utils/i18n.js';

/**
 * The onboarding item type
 * @typedef {import('@Types').OnboardingItem} OnboardingItem
 */

/**
 * Spectrum tabs
 * @typedef {import('@spectrum-web-components/tabs').Tabs} Tabs
 */

/**
 * Spectrum dialog
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

  /**
   * The onboarding items
   * @type {OnboardingItem[]}
   */
  @state()
  accessor items;

  /**
   * The selected index
   * @type {number}
   */
  @state()
  accessor selectedIndex = 0;

  static get styles() {
    return [style];
  }

  async connectedCallback() {
    super.connectedCallback();

    this.fetchIndex();
  }

  /**
   * Fetch the onboarding index
   */
  async fetchIndex() {
    const resp = await fetch(`${TOOLS_ORIGIN}/sidekick/query-index.json`);
    if (!resp.ok) {
      this.remove();
      return;
    }

    const browserLocale = getLanguage();
    const index = await resp.json();
    const onboardingItems = index.data
      .filter(({ category, locale }) => category === 'onboarding' && locale === browserLocale)
      .map(async (item) => {
        const fetchResp = await fetch(`${TOOLS_ORIGIN}${item.path}.plain.html`);
        return fetchResp.ok
          ? { ...item, content: await fetchResp.text() }
          : null;
      });

    this.items = (await Promise.all(onboardingItems)).filter(Boolean);
  }

  /**
   * Handle tab changes
   * @param {*} event
   */
  async onTabChange(event) {
    this.selectedIndex = Number(event.target.value);
  }

  /**
   * Handle next button clicks
   */
  async onNextClicked() {
    // If the user is on the last item, close the dialog
    if (this.selectedIndex + 1 >= this.items.length) {
      this.closeDialog();
      return;
    }

    // Otherwise, move to the next item
    this.selectedIndex += 1;
  }

  /**
   * Handle action button clicks
   */
  async onActionClicked() {
    const { action } = this.items[this.selectedIndex];

    const actionsMap = {
      import: () => {
        this.appStore.sampleRUM('click', { source: 'sidekick', target: 'onboard-modal:import-projects' });
        chrome.runtime.sendMessage({ action: 'importProjects' });
      },
      join_discord: () => {
        this.appStore.sampleRUM('click', { source: 'sidekick', target: 'open-discord' });
        this.appStore.openPage('https://discord.gg/aem-live');
      },
    };

    actionsMap[action]?.();
  }

  /**
   * Close the dialog
   */
  async closeDialog() {
    const onboarded = await getConfig('local', 'onboarded');

    /* istanbul ignore else */
    if (!onboarded) {
      setConfig('local', { onboarded: true, onboardDate: new Date().toISOString() });
    }
    this.remove();
  }

  /**
   * Render the current index
   */
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
    const item = this.items && this.items.length > 0 ? this.items[this.selectedIndex] : null;
    return html`
      ${when(item,
        () => html`
          <sp-underlay open></sp-underlay>
          <sp-dialog-base slot="click-content" class=${this.appStore.theme} open>
            <div class="container">
              <nav>
                <div class="heading">${this.appStore.i18n('whats_new')}</div>
                <sp-tabs quiet direction="vertical" selected=${this.selectedIndex}>
                  ${this.items.map((onboardingItem, index) => html`
                    <sp-tab 
                      label=${onboardingItem.title} 
                      value=${index} 
                      @click=${this.onTabChange}
                    ></sp-tab>
                  `)}
                </sp-tabs>
              </nav>
              <div>
                <div class="content">
                  ${this.renderCurrentIndex()}
                  <sp-button-group>   
                    ${when(item.action,
                      () => html`
                        <sp-button
                          id="action"
                          variant="secondary"
                          treatment="fill"
                          @click=${this.onActionClicked}
                        >
                          ${this.appStore.i18n(item.action)}
                        </sp-button>
                      `,
                    )}
                    <sp-button
                      id="next"
                      variant="cta"
                      treatment="fill"
                      @click=${this.onNextClicked}
                    >
                      ${this.selectedIndex === this.items.length - 1 ? this.appStore.i18n('close') : this.appStore.i18n('next')}
                    </sp-button>
                  </sp-button-group>
                </div>
              </div>
            </div>
            <sp-button 
              id="close-button" 
              static=${this.appStore.theme === 'dark' ? 'black' : 'white'} 
              label="Close" 
              @click=${this.closeDialog} 
              icon-only
            >
              <sp-icon slot="icon" size="m">
                ${ICONS.CLOSE_X}
              </sp-icon>
            </sp-button>
          </sp-dialog-base>
      `)}`;
  }
}

customElements.define('onboarding-dialog', OnBoardingDialog);
