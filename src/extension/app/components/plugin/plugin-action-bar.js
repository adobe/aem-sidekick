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
import { customElement, queryAll, queryAsync } from 'lit/decorators.js';
import { reaction } from 'mobx';
import { ICONS, STATE } from '../../constants.js';
import { style } from './plugin-action-bar.css.js';
import { ConnectedElement } from '../connected-element/connected-element.js';
import '../action-bar/activity-action/activity-action.js';

/**
 * @typedef {import('../plugin/plugin.js').Plugin} Plugin
 */

/**
 * The lit template result type
 * @typedef {import('lit').TemplateResult} TemplateResult
 */

@customElement('plugin-action-bar')
export class PluginActionBar extends ConnectedElement {
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
   * The plugins temporarily folded into the action menu.
   * @type {Plugin[]}
   */
  transientPlugins = [];

  /**
   * The current width of the action bar.
   * @type {number}
   */
  actionBarWidth = 0;

  @queryAsync('action-bar')
  accessor actionBar;

  @queryAll('sp-action-group')
  accessor actionGroups;

  /**
   * Loads the user preferences for plugins in this environment.
   */
  async connectedCallback() {
    super.connectedCallback();

    reaction(
      () => this.appStore.state,
      async () => {
        this.visiblePlugins = [
          ...Object.values(this.appStore.corePlugins),
          ...Object.values(this.appStore.customPlugins),
        ].filter((plugin) => plugin.isVisible());

        this.barPlugins = this.visiblePlugins
          .filter((plugin) => plugin.isPinned());

        this.menuPlugins = this.visiblePlugins
          .filter((plugin) => !plugin.isPinned());

        const actionBar = await this.actionBar;
        if (actionBar) {
          if (this.appStore.state === STATE.TOAST) {
            actionBar.classList.add(this.appStore.toast.variant);

            setTimeout(() => {
              actionBar.className = '';
              if (this.appStore.toast?.actionCallback) {
                this.appStore.toast?.actionCallback();
              }
              this.appStore.closeToast();
            }, this.appStore.toast.timeout);
            // We need to reset the class name to remove the toast variant, but only if it exists.
            // It's possible for actionBar to be null on the first render.
          } else if (actionBar) {
            actionBar.className = '';
          }
        }

        this.requestUpdate();
      },
    );
  }

  async checkOverflow() {
    if (this.actionGroups.length < 3) {
      // wait for all action groups to be rendered
      return;
    }

    const barWidth = parseInt(window.getComputedStyle(this).width, 10);
    const barWidthSameOrLess = barWidth <= this.actionBarWidth;

    // Left plugin container styles
    const leftStyles = window.getComputedStyle(this.actionGroups[0]);
    const leftPadding = parseInt(leftStyles.padding, 10);
    const leftWidth = parseInt(leftStyles.width, 10) + leftPadding * 2;

    // Plugin menu container styles
    const pluginMenuStyles = window.getComputedStyle(this.actionGroups[1]);
    const pluginMenuWidth = parseInt(pluginMenuStyles.width, 10);

    // System plugin container styles
    const systemStyles = window.getComputedStyle(this.actionGroups[2]);
    const systemPadding = parseInt(systemStyles.padding, 10);
    const systemWidth = parseInt(systemStyles.width, 10);

    // Combined width of system plugins and plugin menu containers
    const rightWidth = pluginMenuWidth + systemWidth + (systemPadding * 2) + 8;

    // Try moving the first transient plugin back to the bar
    if (barWidthSameOrLess) {
      // If the left plugins are wider than the bar, move the last one to the menu
      if (leftWidth > barWidth - rightWidth && this.barPlugins.length > 1) {
        this.transientPlugins.unshift(this.barPlugins.pop());
        this.requestUpdate();
      }
    // Try moving the first menu plugin back to the bar
    } else if (this.transientPlugins[0]) {
      this.barPlugins.push(this.transientPlugins.shift());
      this.requestUpdate();
    }
    this.actionBarWidth = barWidth;
  }

  firstUpdated() {
    window.addEventListener('resize', () => {
      this.checkOverflow();
    });
  }

  async updated() {
    await this.updateComplete;
    this.checkOverflow();
  }

  // istanbul ignore next 4
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

  /**
   * Render the plugin menu with unpinned and transient plugins
   * @returns {TemplateResult|string} An array of Lit-html templates or strings, or a single empty string.
   */
  renderPluginMenu() {
    if (this.appStore.state === STATE.TOAST) {
      return html``;
    }

    if (this.appStore.state !== STATE.READY) {
      return html`<sp-action-group></sp-action-group>`;
    }

    return html`
      <sp-action-group>
        ${this.transientPlugins.length > 0 || this.menuPlugins.length > 0 ? html`
          <sp-action-menu
            id="plugin-menu"
            chevron="false"
            placement="top"
            label=""
            title="${this.appStore.i18n('plugins_more')}"
            quiet
            @change=${this.onPluginMenuSelect}
            .disabled=${this.appStore.state !== STATE.READY}>
            <sp-icon slot="icon" size="m">
              ${ICONS.MORE_ICON}
            </sp-icon>
            ${this.transientPlugins.map((p) => this.renderPluginMenuItem(p))}
            ${this.menuPlugins.length > 0 && this.transientPlugins.length > 0
              ? html`<sp-menu-divider size="s"></sp-menu-divider>`
              : ''}
            ${this.menuPlugins.map((p) => this.renderPluginMenuItem(p))}
          </sp-action-menu>
        ` : ''}
      </sp-action-group>
      `;
  }

  /**
   * Render the pinned core and custom plugins
   * @returns {(TemplateResult|string)|string} An array of Lit-html templates or strings, or a single empty string.
   */
  renderPlugins() {
    if (this.appStore.state !== STATE.READY) {
      return html`
        <sp-action-group>
          <activity-action></activity-action>
        </sp-action-group>`;
    }

    return html`
      <sp-action-group>
        ${this.barPlugins.length > 0 ? this.barPlugins.map((p) => p.render()) : ''}
      </sp-action-group>`;
  }

  renderSystemPlugins() {
    const { siteStore } = this.appStore;

    const systemPlugins = [];

    if (this.appStore.state === STATE.TOAST) {
      return html``;
    }

    const properties = html`
      <sp-action-button id="properties" quiet>
        <sp-icon slot="icon" size="l">
          ${ICONS.PROPERTIES}
        </sp-icon>
      </sp-action-button>`;
    systemPlugins.push(properties);

    const buttonType = siteStore.authorized ? '' : 'not-authorized';
    systemPlugins.push(html`
      <login-button id="user" class=${buttonType}></login-button>
    `);

    systemPlugins.push(ICONS.ADOBE_LOGO);

    const actionGroup = html`<sp-action-group>${systemPlugins}</sp-action-group>`;
    const divider = html`<sp-menu-divider size="s" vertical></sp-menu-divider>`;

    return [divider, actionGroup];
  }

  render() {
    return this.appStore.state !== STATE.INITIALIZING ? html`
      <action-bar>
        ${this.renderPlugins()}
        ${this.renderPluginMenu()}
        ${this.renderSystemPlugins()}
      </action-bar>
    ` : '';
  }
}
