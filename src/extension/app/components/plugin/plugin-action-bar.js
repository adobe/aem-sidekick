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
      this.checkOverflow();
    });
  }

  checkOverflow() {
    const barWidth = parseInt(window.getComputedStyle(this).width, 10);

    // Left Plugins
    const leftStyles = window.getComputedStyle(this.actionGroups[0]);
    const leftPadding = parseInt(leftStyles.padding, 10);
    const leftWidth = parseInt(leftStyles.width, 10) + leftPadding * 2;

    // Plugin Menu
    const pluginMenuStyles = window.getComputedStyle(this.actionGroups[1]);
    const pluginMenuPadding = parseInt(pluginMenuStyles.padding, 10);

    // System Plugins
    const systemStyles = window.getComputedStyle(this.actionGroups[2]);
    const rightPadding = parseInt(systemStyles.padding, 10);

    // Width of system plugins and plugin menu
    const rightWidth = parseInt(pluginMenuStyles.width, 10) + parseInt(systemStyles.width, 10) + (rightPadding * 2) + (pluginMenuPadding * 2);

    // Open space is total width minus left and right (system plugins and plugin menu)
    const openSpace = barWidth - rightWidth - leftWidth;

    // If the left plugins are wider than the bar, move the last one to the menu
    if (leftWidth > barWidth - rightWidth && this.barPlugins.length > 1) {
      const lastBarPlugin = this.barPlugins.pop();
      this.transientPlugins.unshift(lastBarPlugin);
      this.requestUpdate();
      return;
    }

    // If the last transient plugin fits in the open space, move it back to the bar
    if (this.transientPlugins.length > 0) {
      const lastTransientPlugin = this.transientPlugins[0];
      if (lastTransientPlugin) {
        const { config } = lastTransientPlugin;
        if (config) {
          const estimatedWidth = (config.button.text.length * 6) + 30;
          if (estimatedWidth < openSpace && this.transientPlugins.length > 0) {
            this.barPlugins.push(this.transientPlugins.shift());
            this.requestUpdate();
          }
        }
      }
    }
  }

  async updated() {
    await this.updateComplete;
    this.checkOverflow();
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
    return html`
      <sp-action-group>
        ${this.transientPlugins.length > 0 || this.menuPlugins.length > 0 ? html`
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
          </action-bar-picker>
        ` : ''}
      </sp-action-group>
      `;
  }

  /**
   * Render the core and custom plugins
   * @returns {(TemplateResult|string)|string} An array of Lit-html templates or strings, or a single empty string.
   */
  renderPlugins() {
    // console.log('rendering plugins...', this.barPlugins.length, this.transientPlugins.length, this.menuPlugins.length);
    return html`<sp-action-group>
      ${this.barPlugins.length > 0 ? this.barPlugins.map((p) => p.render()) : ''}
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
        ${this.renderPluginMenu()}
        ${this.renderSystemPlugins()}
      </action-bar>
    ` : '';
  }
}
