/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import '@spectrum-web-components/theme/sp-theme.js';
import '@spectrum-web-components/dialog/sp-dialog-base.js';
import '@spectrum-web-components/checkbox/sp-checkbox.js';
import '@spectrum-web-components/tooltip/sp-tooltip.js';
import '@spectrum-web-components/overlay/sp-overlay.js';
import '@spectrum-web-components/overlay/overlay-trigger.js';
import '@spectrum-web-components/theme/spectrum-two/theme-light-core-tokens.js';
import '@spectrum-web-components/theme/spectrum-two/theme-dark-core-tokens.js';
import '@spectrum-web-components/theme/spectrum-two/scale-medium-core-tokens.js';
import '../../app/components/theme/theme.js';
import { fetchLanguageDict, getLanguage, i18n } from '../../app/utils/i18n.js';
import { style } from './login.css.js';
import { spectrum2 } from '../../app/spectrum-2.css.js';
import sampleRUM from '../../utils/rum.js';
import { getConfig, setConfig, removeConfig } from '../../config.js';
import { ICONS } from '../../app/constants.js';

/**
 * The lit template result type
 * @typedef {import('lit').TemplateResult} TemplateResult
 */
@customElement('login-view')
export class LoginView extends LitElement {
  static get styles() {
    return [spectrum2, style];
  }

  /**
   * The language dictionary`
   * @type {Object}
   */
  @property({ type: Object, state: false })
  accessor languageDict;

  /**
   * The selected theme from sidekick
   * @type {string}
  */
  @property({ type: String })
  accessor theme;

  /**
   * The current auto sign-in preference (reflected by the checkbox).
   * @type {boolean}
   */
  @property({ type: Boolean })
  accessor autoLogin = false;

  async connectedCallback() {
    super.connectedCallback();

    this.theme = await getConfig('local', 'theme') || 'dark';
    document.body.setAttribute('color', this.theme);
    chrome.storage.onChanged.addListener(async (changes, area) => {
      if (area === 'local' && changes.theme?.newValue) {
        this.theme = await getConfig('local', 'theme');
        document.body.setAttribute('color', this.theme);
      }
    });
    const lang = getLanguage();
    this.languageDict = await fetchLanguageDict(undefined, lang);
    const params = new URL(window.location.href).searchParams;
    this.status = params.get('status');
    this.auth = params.get('auth');
    this.heading = i18n(this.languageDict, 'site_protected');
    this.description = this.status === '403'
      ? i18n(this.languageDict, 'site_forbidden')
      : i18n(this.languageDict, this.auth === 'false'
        ? 'site_login_required'
        : 'site_relogin_required');
    this.buttonText = i18n(this.languageDict, 'user_login');
    this.autoLoginLabel = i18n(this.languageDict, 'site_login_auto');
    this.hint = i18n(this.languageDict, 'site_login_hint');

    // reflect the stored auto sign-in preference in the checkbox
    this.autoLogin = await getConfig('local', 'autoLogin') === true;
  }

  /**
   * Triggers the login flow in the parent window.
   * @param {boolean} selectAccount <code>true</code> to allow user to select account
   */
  login(selectAccount) {
    window.parent.postMessage({
      detail: {
        event: 'hlx-login',
        selectAccount,
      },
    }, '*');

    this.shadowRoot?.querySelector('sp-dialog-base')?.removeAttribute('open');
    sampleRUM('click', {
      source: 'sidekick',
      target: 'site:logged-in',
    });
  }

  onClicked({ altKey }) {
    // hold down alt/option key (or 403) to select a different account
    this.login(this.status === '403' || altKey === true);
  }

  onAutoLoginChanged({ target: checkbox }) {
    if (checkbox.checked) {
      setConfig('local', { autoLogin: true });
    } else {
      removeConfig('local', 'autoLogin');
    }
  }

  render() {
    return html`
      <theme-wrapper theme=${this.theme}>
        <div class="container">
          <sp-dialog-base slot="click-content" class=${this.theme} open>
            <div class="content">
              <overlay-trigger placement="right">
                <sp-icon slot="trigger" id="login-hint" label=${this.hint}>
                  ${ICONS.INFO}
                </sp-icon>
                <sp-tooltip slot="hover-content">
                  ${this.hint}
                </sp-tooltip>
              </overlay-trigger>
              <sp-icon slot="icon">
                ${ICONS.USER_ICON_LARGE}
              </sp-icon>
              <h2>${this.heading}</h2>
              <span>${this.description}</span>
              <sp-button
                id="login"
                size="l"
                variant="cta"
                treatment="fill"
                @click=${this.onClicked}
              >
                ${this.buttonText}
              </sp-button>
              <sp-checkbox
                id="auto-login"
                size="m"
                ?checked=${this.autoLogin}
                @change=${this.onAutoLoginChanged}
              >
                ${this.autoLoginLabel}
              </sp-checkbox>
            </div>
          </sp-dialog-base>
        </div>
      </theme-wrapper>
    `;
  }
}
