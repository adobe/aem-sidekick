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
import { ifDefined } from 'lit/directives/if-defined.js';
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

/**
 * The gap between plugins in the plugin group
 */
const PLUGIN_GROUP_GAP = 8;

/**
 * The maximum width of the action bar
 */
const ACTION_BAR_MAX_WIDTH = 800;

/**
 * The threshold for overflow
 */
const OVERFLOW_THRESHOLD = -10;

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

  @queryAsync('.logo')
  accessor logoContainer;

  @queryAll('div.action-group')
  accessor actionGroups;

  @queryAsync('sp-action-menu#plugin-menu')
  accessor pluginMenu;

  @queryAsync('sp-action-menu#sidekick-menu')
  accessor sidekickMenu;

  @queryAsync('.close-button')
  accessor closeButton;

  /**
   * Set up the bar and menu plugins in this environment and updates the component.
   */
  setupPlugins() {
    this.transientPlugins = [];

    this.visiblePlugins = [
      ...Object.values(this.appStore.corePlugins),
      ...Object.values(this.appStore.customPlugins),
    ].filter((plugin) => plugin.isVisible());

    this.barPlugins = this.visiblePlugins
      .filter((plugin) => plugin.isPinned() && !plugin.isBadge());

    this.menuPlugins = this.visiblePlugins
      .filter((plugin) => !plugin.isPinned() && !plugin.isBadge());

    this.badgePlugins = this.visiblePlugins
      .filter((plugin) => plugin.isBadge());

    this.requestUpdate();
  }

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

    // trap clicks inside action bar
    this.addEventListener('click', this.onClick);
    this.requestUpdate();
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.onClick);
  }

  /**
   * Utility function to calculate the total width of an element including padding.
   * @param {HTMLElement} element - The DOM element.
   * @returns {number} - The total width in pixels.
   */
  getTotalWidth = (element) => {
    const styles = window.getComputedStyle(element);
    const width = parseInt(styles.width, 10) || 0;
    const padding = parseInt(styles.padding, 10) || 0;
    return width + padding * 2;
  };

  async checkOverflow() {
    if (this.actionGroups.length < 3) {
      // wait for all action groups to be rendered
      return;
    }

    const [logoContainer, closeButton] = await Promise.all([this.logoContainer, this.closeButton]);

    // Action bar styles
    const barWidth = parseInt(window.getComputedStyle(this).width, 10);
    const logoWidth = this.getTotalWidth(logoContainer);
    const closeButtonWidth = parseInt(window.getComputedStyle(closeButton).width, 10);

    const [pluginGroup, pluginMenu, systemGroup] = this.actionGroups;

    // Left plugin container styles
    const pluginGroupStyles = window.getComputedStyle(pluginGroup);
    const pluginGroupPadding = parseInt(pluginGroupStyles.padding, 10);
    const pluginGroupWidth = parseInt(pluginGroupStyles.width, 10);
    const pluginGroupWidthIncludingPadding = pluginGroupWidth + (pluginGroupPadding * 2);

    const pluginMenuWidth = this.getTotalWidth(pluginMenu);
    const systemWidth = this.getTotalWidth(systemGroup);

    // Combined width of system plugins, plugin menu, and close button
    const rightWidth = pluginMenuWidth + systemWidth + closeButtonWidth;

    // Combined width of left logo and plugin group
    const leftWidth = pluginGroupWidthIncludingPadding + logoWidth;

    // Total free space in the bar
    const totalFreeSpace = barWidth - leftWidth - rightWidth;

    // If there's not enough space for the plugins in the bar, move the last plugin to the menu
    // We check against -10 to avoid endless loop caused after a plugin is added to back to the bar
    if (totalFreeSpace <= OVERFLOW_THRESHOLD && this.barPlugins.length > 1) {
      this.transientPlugins.unshift(this.barPlugins.pop());
      this.requestUpdate();
    // If we don't need to remove a plugin and if the action bar is less than 800px wide,
    // the logic must adjust to check if there's space for the next plugin
    } else if (window.innerWidth < ACTION_BAR_MAX_WIDTH) {
      const nextPlugin = this.transientPlugins[0];
      if (nextPlugin) {
        const children = Array.from(this.actionGroups[0].children);

        let childrenWidth = children.reduce((acc, child) => acc + child.clientWidth, 0);
        // Account for the gap between the plugins
        childrenWidth += (children.length - 1) * PLUGIN_GROUP_GAP;

        // Calculate the hypothetical new width of the plugins group if we added the next plugin
        const nextPluginWidth = nextPlugin.getEstimatedWidth();
        const newWidth = nextPluginWidth + childrenWidth + PLUGIN_GROUP_GAP;

        // If the new width is less than the plugin group width, add the plugin to the bar
        if (newWidth < pluginGroupWidth) {
          this.barPlugins.push(this.transientPlugins.shift());
          this.requestUpdate();
        }
      }
    } else {
      // If the action bar is wider than 800px, and we don't need to remove a plugin, check if there's space for the next plugin
      const extraSpace = ACTION_BAR_MAX_WIDTH - barWidth;
      if (this.transientPlugins.length > 0) {
        const nextPlugin = this.transientPlugins[0];
        if (nextPlugin) {
          const nextPluginWidth = nextPlugin.getEstimatedWidth();
          if (nextPluginWidth < extraSpace) {
            this.barPlugins.push(this.transientPlugins.shift());
            this.requestUpdate();
          }
        }
      }
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

  onClick(e) {
    e.stopPropagation();
  }

  /**
   * Handles the keydown event on the close button.
   * @param {KeyboardEvent} e The keyboard event.
   */
  // istanbul ignore next 5
  onCloseButtonKeyDown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      this.onCloseButtonClick();
    }
  }

  /**
   * Handles the click event on the close button.
   */
  onCloseButtonClick() {
    this.appStore.fireEvent('hidden');
  }

  /**
   * Renders the logo. Hidden when the state is TOAST.
   * @returns {TemplateResult} The Lit-html template for the logo.
   */
  renderLogo() {
    if (this.appStore.state === STATE.TOAST) {
      return html``;
    }

    return html`
      <div class="logo">
        ${ICONS.SIDEKICK_LOGO}
      </div>
      <sp-menu-divider size="s" vertical></sp-menu-divider>
    `;
  }

  /**
   * Renders the close button. Hidden when the state is TOAST.
   * @returns {TemplateResult} The Lit-html template for the close button.
   */
  renderCloseButton() {
    if (this.appStore.state === STATE.TOAST) {
      return html``;
    }

    return html`
      <div class="close-button" @click=${this.onCloseButtonClick} @keydown=${this.onCloseButtonKeyDown} title="Close Sidekick">
        <sp-menu-divider size="s" vertical></sp-menu-divider>
        <sp-icon size="m">${ICONS.CLOSE_SIDEKICK}</sp-icon>
      </div>
    `;
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
      <div class=${`action-group plugin-menu-container ${this.menuPlugins.length === 0 ? 'hidden' : ''}`}>
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

  /**
   * Renders the badge plugins.
   *
   * @returns {TemplateResult} The HTML template for the badge plugin.
   */
  renderBadgePlugins() {
    if (this.appStore.state !== STATE.READY || this.badgePlugins.length === 0) {
      return html``;
    }

    return html`
      <div class="badge-plugins-container">
        ${this.badgePlugins.map((p) => p.render())}
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

    if (value === 'whats-new-opened') {
      this.appStore.sampleRUM('click', { source: 'sidekick', target: 'whats-new-opened' });
      this.appStore.showOnboarding();
      return;
    }

    if (value === 'project-added' || value === 'project-removed') {
      this.appStore.sampleRUM('click', { source: 'sidekick', target: value });
      chrome.runtime.sendMessage({ action: 'addRemoveProject' });
      return;
    }

    this.appStore.fireEvent(value);
  }

  toggleTheme(e) {
    e.stopPropagation();
    this.appStore.toggleTheme();
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
        <sk-menu-item class="icon-item" value="whats-new-opened"  @click=${this.handleItemSelection}>
          <sp-icon slot="icon" size="m">
            ${ICONS.PRESENT_ICON}
          </sp-icon>
          ${this.appStore.i18n('whats_new')}
        </sk-menu-item>
        <sp-divider size="s"></sp-divider>
        <div class="theme-switch" value="theme" tabindex="-1">
          <sp-switch slot="toggle" checked=${ifDefined(this.appStore.theme === 'dark' ? true : undefined)} @change=${this.toggleTheme}>Dark Mode</sp-switch>
        </div>
      </sp-action-menu>`;
    systemPlugins.push(properties);

    const buttonType = siteStore.authorized ? '' : 'not-authorized';
    systemPlugins.push(html`
      <login-button id="user" class=${buttonType}></login-button>
    `);

    const actionGroup = html`<div class="action-group system-plugins-container">${systemPlugins}</div>`;
    const divider = html`<sp-menu-divider size="s" vertical></sp-menu-divider>`;

    return [divider, actionGroup];
  }

  render() {
    return this.appStore.state !== STATE.INITIALIZING ? html`
      <action-bar>
        ${this.renderLogo()}
        ${this.renderPlugins()}
        ${this.renderPluginMenu()}
        ${this.renderSystemPlugins()}
        ${this.renderBadgePlugins()}
        ${this.renderCloseButton()}
      </action-bar>
    ` : '';
  }
}
