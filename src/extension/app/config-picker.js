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
import { customElement, property } from 'lit/decorators.js';
import { style } from './config-picker.css.js';
import { fetchLanguageDict, getLanguage, i18n } from './utils/i18n.js';
import { spectrum2 } from './spectrum-2.css.js';
import { getConfig } from '../config.js';

/**
 * The modal type
 * @typedef {import('@Types').OptionsConfig} OptionsConfig
 */

@customElement('aem-config-picker')
export class AEMConfigPicker extends LitElement {
  /**
   * Array of matched configs to pick from
   * @type {OptionsConfig[]}
   */
  @property({ type: Array })
  accessor matchedConfigs;

  /**
   * Pick a project label
   * @type {string}
   */
  @property({ type: String })
  accessor ctaLabel;

  static get styles() {
    return [spectrum2, style];
  }

  constructor(matchedConfigs) {
    super();

    this.matchedConfigs = matchedConfigs;
  }

  async connectedCallback() {
    super.connectedCallback();

    this.theme = await getConfig('local', 'theme') || 'dark';
    this.lang = getLanguage();
    this.languageDict = await fetchLanguageDict(undefined, this.lang);
    this.ctaLabel = `${i18n(this.languageDict, 'config_project_pick')}:`;
  }

  configSelected(config) {
    this.dispatchEvent(
      new CustomEvent('configselected', {
        detail: {
          config,
        },
      }),
    );

    this.remove();
  }

  render() {
    return html`
      <theme-wrapper theme=${this.theme}>
        <action-bar>
            <sp-action-group>
              <span>${this.ctaLabel}</span>
              ${this.matchedConfigs.map((config) => html`
                <sk-action-button aria-label=${config.id} @click=${() => this.configSelected(config)} quiet>
                  ${config.project || config.id}
                </sk-action-button>
              `)}
            </sp-action-group>
        </action-bar>
      </theme-wrapper>
    `;
  }
}
