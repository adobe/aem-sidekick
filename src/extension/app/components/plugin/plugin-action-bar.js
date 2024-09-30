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
import '../bulk/bulk-info/bulk-info.js';

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

  @queryAll('div.action-group')
  accessor actionGroups;

  @queryAsync('sp-action-menu#plugin-menu')
  accessor pluginMenu;

  @queryAsync('sp-action-menu#sidekick-menu')
  accessor sidekickMenu;

  /**
   * Set up the bar and menu plugins in this environment and updates the component.
   */
  setupPlugins() {
    this.visiblePlugins = [
      ...Object.values(this.appStore.corePlugins),
      ...Object.values(this.appStore.customPlugins),
    ].filter((plugin) => plugin.isVisible());

    this.barPlugins = this.visiblePlugins
      .filter((plugin) => plugin.isPinned());

    this.menuPlugins = this.visiblePlugins
      .filter((plugin) => !plugin.isPinned());

    this.requestUpdate();
  }

  /**
   * Loads the user preferences for plugins in this environment.
   */
  async connectedCallback() {
    super.connectedCallback();

    reaction(
      () => this.appStore.state,
      async () => {
        const actionBar = await this.actionBar;
        if (actionBar) {
          if (this.appStore.state === STATE.TOAST) {
            actionBar.classList.add(this.appStore.toast.variant);

            // We need to reset the class name to remove the toast variant, but only if it exists.
            // It's possible for actionBar to be null on the first render.
          } else if (actionBar) {
            actionBar.className = '';
          }
        }

        this.setupPlugins();
      },
    );

    reaction(
      () => this.appStore.bulkStore.selection,
      () => {
        this.setupPlugins();
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
    const pluginMenuPadding = parseInt(pluginMenuStyles.padding, 10);
    const pluginMenuWidth = parseInt(pluginMenuStyles.width, 10);

    // System plugin container styles
    const systemStyles = window.getComputedStyle(this.actionGroups[2]);
    const systemPadding = parseInt(systemStyles.padding, 10);
    const systemWidth = parseInt(systemStyles.width, 10);

    // Combined width of system plugins and plugin menu containers
    const rightWidth = pluginMenuWidth + (pluginMenuPadding * 2) + systemWidth + (systemPadding * 2) + 2;

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

  // istanbul ignore next 7
  async onPluginMenuSelect() {
    // @ts-ignore
    const pluginMenu = await this.pluginMenu;
    if (pluginMenu) {
      pluginMenu.value = '';
    }
  }

  renderPluginMenuItem(plugin) {
    return plugin.isContainer()
      ? html`<sp-menu-group id="plugin-group-${plugin.id}" selects="single">
          <span slot="header">${plugin.getButtonText()}</span>
          ${Object.values(plugin.children).map((p) => p.render())}
        </sp-menu-group>`
      : html`<sk-menu-item
          class="${plugin.id}"
          id="plugin-${plugin.id}"
          @click=${(evt) => plugin.onButtonClick(evt)}
          tabindex="0"
          .disabled=${!plugin.isEnabled()}>
          ${plugin.getButtonText()}
        </sk-menu-item>`;
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
      return html`<div class="action-group"></div>`;
    }

    return html`
      <div class="action-group plugin-menu-container">
        ${this.transientPlugins.length > 0 || this.menuPlugins.length > 0 ? html`
          <sp-action-menu
            id="plugin-menu"
            chevron="false"
            placement="top"
            label=""
            title="${this.appStore.i18n('plugins_more')}"
            quiet
            tabindex="0"
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
      </div>
      `;
  }

  /**
   * Render the pinned core and custom plugins
   * @returns {(TemplateResult|string)|string} An array of Lit-html templates or strings, or a single empty string.
   */
  renderPlugins() {
    if (this.appStore.state !== STATE.READY) {
      return html`
        <div class="action-group activity-container">
          <activity-action></activity-action>
        </div>`;
    }

    return html`
      <div class="action-group plugins-container">
        ${this.appStore.isAdmin()
          ? html`<bulk-info></bulk-info><sp-menu-divider size="s" vertical></sp-menu-divider>`
          : ''}
        ${this.barPlugins.length > 0 ? this.barPlugins.map((p) => p.render()) : ''}
      </div>`;
  }

  async handleItemSelection(event) {
    const { value } = event.target;

    const menu = await this.sidekickMenu;
    menu.removeAttribute('open');

    if (value === 'help-opened') {
      this.appStore.sampleRUM('click', { source: 'sidekick', target: 'help-opened' });
      this.appStore.openPage('https://www.aem.live/docs/sidekick');
      return;
    }

    if (value === 'project-added' || value === 'project-removed') {
      this.appStore.sampleRUM('click', { source: 'sidekick', target: value });
      chrome.runtime.sendMessage({ action: 'addRemoveProject' });
      return;
    }

    this.appStore.fireEvent(value);
  }

  renderSystemPlugins() {
    const { siteStore } = this.appStore;

    const systemPlugins = [];

    if (this.appStore.state === STATE.TOAST) {
      return html``;
    }

    const properties = html`
      <sp-action-menu id="sidekick-menu" placement="top" quiet tabindex="0">
        <sp-icon slot="icon" size="l">
          ${ICONS.HAMBURGER_ICON}
        </sp-icon>
        ${siteStore.transient
          ? html`
            <sk-menu-item class="icon-item" value="project-added" @click=${this.handleItemSelection}>
              <sp-icon slot="icon" size="m">
                ${ICONS.PLUS_ICON}
              </sp-icon>
              ${this.appStore.i18n('config_project_add')}
            </sk-menu-item>
          ` : html`
            <sk-menu-item class="icon-item destructive" value="project-removed" @click=${this.handleItemSelection}>
              <sp-icon slot="icon" size="m">
                ${ICONS.TRASH_ICON}
              </sp-icon>
              ${this.appStore.i18n('config_project_remove')}
            </sk-menu-item>
          `
        }
        <sk-menu-item class="icon-item" value="help-opened"  @click=${this.handleItemSelection}>
          <sp-icon slot="icon" size="m">
            ${ICONS.HELP_ICON}
          </sp-icon>
          ${this.appStore.i18n('help_documentation')}
        </sk-menu-item>
        <sp-divider size="s"></sp-divider>
        <sk-menu-item class="close icon-item" value="hidden" @click=${this.handleItemSelection}>
          <sp-icon slot="icon" size="m">
            ${ICONS.CLOSE_X}
          </sp-icon>
          ${this.appStore.i18n('close_sidekick')}
        </sk-menu-item>
      </sp-action-menu>`;
    systemPlugins.push(properties);

    const buttonType = siteStore.authorized ? '' : 'not-authorized';
    systemPlugins.push(html`
      <login-button id="user" class=${buttonType}></login-button>
    `);

    systemPlugins.push(html`
      <div class="logo">
        ${ICONS.SIDEKICK_LOGO}
      </div>
    `);

    const actionGroup = html`<div class="action-group system-plugins-container">${systemPlugins}</div>`;
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
