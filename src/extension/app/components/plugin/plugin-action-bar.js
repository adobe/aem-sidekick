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

/* eslint-disable max-len */

import { html } from 'lit';
import {
  customElement, property, query, queryAll,
} from 'lit/decorators.js';
import { MobxLitElement } from '@adobe/lit-mobx';
import { reaction } from 'mobx';
import { appStore } from '../../store/app.js';
import { ICONS } from '../../constants.js';
import { style } from './plugin-action-bar.css.js';

/**
 * @typedef {import('../plugin/plugin.js').Plugin} Plugin
 */

/**
 * The lit template result type
 * @typedef {import('lit').TemplateResult} TemplateResult
 */

@customElement('plugin-action-bar')
export class PluginActionBar extends MobxLitElement {
  static get styles() {
    return [
      style,
    ];
  }

  /**
   * All core and custom plugins visible in this environment.
   * @type {Plugin[]}
   */
  visiblePlugins = [];

  /**
   * The plugins visible in the action bar.
   * @type {Plugin[]}
   */
  barPlugins = [];

  /**
   * The plugins folded into the action menu.
   * @type {Plugin[]}
   */
  menuPlugins = [];

  /**
   * The plugins temprarily folded into the action menu.
   * @type {Plugin[]}
   */
  transientPlugins = [];

  /**
   * Are we ready to render?
   * @type {boolean}
   */
  @property({ type: Boolean, attribute: false })
  accessor ready = false;

  @query('action-bar')
  accessor actionBar;

  @queryAll('sp-action-group')
  accessor actionGroups;

  /**
   * Loads the user preferences for plugins in this environment.
   */
  async connectedCallback() {
    super.connectedCallback();
    this.ready = true;

    reaction(
      () => appStore.status,
      () => {
        this.visiblePlugins = [
          ...Object.values(appStore.corePlugins),
          ...Object.values(appStore.customPlugins),
        ].filter((plugin) => plugin.isVisible());

        this.barPlugins = this.visiblePlugins
          .filter((plugin) => plugin.isPinned());

        this.menuPlugins = this.visiblePlugins
          .filter((plugin) => !plugin.isPinned());

        this.requestUpdate();
      },
    );
  }

  firstUpdated() {
    window.addEventListener('resize', () => {
      this.resizing = Date.now();
      window.setTimeout(() => {
        if (this.resizing + 100 < Date.now()) {
          this.resizing = 0;
          // move transient plugins from menu back to bar
          if (this.transientPlugins.length > 0) {
            this.barPlugins.push(...this.transientPlugins);
            this.transientPlugins = [];
          }
          this.requestUpdate();
        }
      }, 100);
    });
  }

  checkOverflow() {
    const barWidth = parseInt(window.getComputedStyle(this).width, 10);
    // console.log('check overflow...', barWidth);
    const leftStyles = window.getComputedStyle(this.actionGroups[0]);
    const leftPadding = parseInt(leftStyles.padding, 10);
    const leftWidth = parseInt(leftStyles.width, 10) + leftPadding * 2;
    const rightStyles = window.getComputedStyle(this.actionGroups[1]);
    const rightPadding = parseInt(rightStyles.padding, 10);
    const rightWidth = parseInt(rightStyles.width, 10) + rightPadding * 2;

    if (leftWidth > barWidth - rightWidth && this.barPlugins.length > 1) {
      // console.log('overflow detected...');
      // move last plugin from bar to menu and repaint
      const lastBarPlugin = this.barPlugins.pop();
      this.transientPlugins.unshift(lastBarPlugin);
      this.requestUpdate();
    }
  }

  async updated() {
    await this.updateComplete;
    this.checkOverflow();
    // console.log('updated', this.barPlugins.length, this.transientPlugins.length, this.menuPlugins.length);
  }

  onPluginMenuSelect() {
    // @ts-ignore
    this.shadowRoot.querySelector('#plugin-menu').value = '';
  }

  renderPluginMenuItem(plugin) {
    return plugin.isContainer()
      ? html`<sp-menu-group id="plugin-group-${plugin.id}">
          <span slot="header">${plugin.getButtonText()}</span>
          ${Object.values(plugin.children).map((p) => p.render())}
        </sp-menu-group>`
      : html`<sp-menu-item
          class="${plugin.id}"
          id="plugin-${plugin.id}"
          @click=${(evt) => plugin.onButtonClick(evt)}
          .disabled=${!plugin.isEnabled()}>
          ${plugin.getButtonText()}
        </sp-menu-item>`;
  }

  renderPluginMenu() {
    return this.transientPlugins.length > 0 || this.menuPlugins.length > 0 ? html`
      <action-bar-picker
        id="plugin-menu"
        chevron="false"
        placement="top"
        label="⋯"
        title="${appStore.i18n('plugins_more')}"
        quiet
        @change=${this.onPluginMenuSelect}
        .disabled=${!this.ready}>
        ${this.transientPlugins.map((p) => this.renderPluginMenuItem(p))}
        ${this.menuPlugins.length > 0 && this.transientPlugins.length > 0
          ? html`<sp-menu-divider size="s"></sp-menu-divider>`
          : ''}
        ${this.menuPlugins.map((p) => this.renderPluginMenuItem(p))}
      </action-bar-picker>` : '';
  }

  /**
   * Render the core and custom plugins
   * @returns {(TemplateResult|string)|string} An array of Lit-html templates or strings, or a single empty string.
   */
  renderPlugins() {
    // console.log('rendering plugins...', this.barPlugins.length, this.transientPlugins.length, this.menuPlugins.length);
    return html`<sp-action-group>
      ${this.barPlugins.length > 0 ? this.barPlugins.map((p) => p.render()) : ''}
      <div class="filler"></div>
      ${this.renderPluginMenu()}
    </sp-action-group>`;
  }

  renderSystemPlugins() {
    const { profile } = appStore.status;
    const { siteStore } = appStore;

    const systemPlugins = [];

    const properties = html`
      <sp-action-button id="properties" quiet>
        <sp-icon slot="icon" size="l">
          ${ICONS.PROPERTIES}
        </sp-icon>
      </sp-action-button>`;
    systemPlugins.push(properties);

    const loggedIn = profile && siteStore.authorized;

    // If we are not logged in or we have a profile, show the login button
    if (profile || !loggedIn) {
      const authStatus = loggedIn ? '' : 'not-authorized';
      systemPlugins.push(html`
        <login-button id="user" class=${authStatus}></login-button>
      `);
    }

    systemPlugins.push(ICONS.ADOBE_LOGO);

    const actionGroup = html`<sp-action-group>${systemPlugins}</sp-action-group>`;
    const divider = html`<sp-menu-divider size="s" vertical></sp-menu-divider>`;

    return [divider, actionGroup];
  }

  render() {
    return this.ready ? html`
      <action-bar>
        ${this.renderPlugins()}
        ${this.renderSystemPlugins()}
      </action-bar>
    ` : '';
  }
}
