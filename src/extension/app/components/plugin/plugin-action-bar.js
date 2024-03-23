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

import { html, render } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { MobxLitElement } from '@adobe/lit-mobx';
import { reaction } from 'mobx';
import { appStore } from '../../store/app.js';
import { getConfig, setConfig } from '../../../config.js';
import { ICONS } from '../../constants.js';
import { style } from './plugin-action-bar.css.js';

/**
 * @typedef {import('../plugin/plugin.js').SidekickPlugin} SidekickPlugin
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
   * The user preferences for plugins in this environment.
   * @type {Object}
   */
  @property({ type: Object, attribute: false })
  accessor userPrefs = null;

  /**
   * The current environment
   * @type {string}
   */
  currentEnv = '';

  /**
   * The core and custom plugins allowed in the current environment.
   * @type {Object}
   */
  allowedPlugins = {};

  /**
   * The plugin menu overlay
   * @type {HTMLElement}
   */
  pluginMenuOverlay = null;

  /**
  * Are we ready to render?
  * @type {boolean}
  */
  @property({ type: Boolean, attribute: false })
  accessor ready = false;

  /**
   * Loads the user preferences for plugins in this environment.
   */
  async connectedCallback() {
    super.connectedCallback();

    this.userPrefs = await getConfig('sync', 'pluginPrefs') || {};
    this.currentEnv = appStore.getEnv();
    this.ready = true;

    reaction(
      () => appStore.status,
      () => {
        this.requestUpdate();
      },
    );
  }

  /**
   * Returns the user preferences for a plugin.
   * @param {string} id The plugin ID
   * @returns {Object} The preferences
   */
  getPluginPrefs(id) {
    return this.userPrefs[this.currentEnv]?.[id];
  }

  /**
   * Filters the plugin menu.
   * @param {string} filter The filter term
   */
  filterPluginMenu(filter) {
    // TODO: Implement filtering
    // eslint-disable-next-line no-console
    console.log('Filtering plugin menu', filter);
  }

  /**
   * Toggles the pinned state of a plugin.
   * @param {SidekickPlugin} plugin The plugin
   * @param {Object} e The event
   */
  async togglePlugin(plugin, e) {
    e.stopPropagation();
    const button = e.target.closest('sp-button');
    const userPrefs = await getConfig('sync', 'pluginPrefs');
    const { id } = plugin;

    let envPrefs = userPrefs[this.currentEnv];
    if (!envPrefs) {
      // create prefs for current environment
      envPrefs = {};
      userPrefs[this.currentEnv] = envPrefs;
    }

    let pluginPrefs = envPrefs[id];
    if (!pluginPrefs) {
      // create plugin prefs for current environment
      pluginPrefs = {};
      envPrefs[id] = pluginPrefs;
    }

    // flip the pinned state
    const newPinnedState = !plugin.isPinned(pluginPrefs);
    pluginPrefs.pinned = newPinnedState;

    // toggle button state
    button.setAttribute('title', newPinnedState
      ? appStore.i18n('plugin_unpin')
      : appStore.i18n('plugin_pin'));
    const icon = button.querySelector('sp-icon');
    icon.innerHTML = newPinnedState
      // TODO: Use imported ICONS
      ? `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14.4424 18.499C14.1323 18.499 13.8218 18.4092 13.5469 18.229L11.1758 16.6719C10.4629 16.2031 9.49463 16.2031 8.78076 16.6719L6.41015 18.229C5.83788 18.605 5.11083 18.5869 4.55712 18.185C4.00341 17.7832 3.76269 17.0967 3.94286 16.4365L4.90331 12.9228C5.0039 12.5557 4.87694 12.1645 4.58007 11.9268L1.7373 9.64892C1.20312 9.2207 0.995108 8.52343 1.20654 7.87255C1.41845 7.22216 1.99658 6.78075 2.67968 6.74853L6.31786 6.57617C6.69823 6.55859 7.03075 6.31689 7.16552 5.96045L8.45409 2.55322C8.69579 1.91357 9.29393 1.50049 9.97802 1.5C10.6621 1.5 11.2607 1.91357 11.5029 2.55322L12.791 5.96045C12.9258 6.3169 13.2583 6.55859 13.6387 6.57617L17.2773 6.74853C17.9604 6.78076 18.5386 7.22216 18.7505 7.87304C18.9619 8.52392 18.7534 9.2207 18.2192 9.64892L15.3769 11.9268C15.0801 12.1645 14.9531 12.5557 15.0537 12.9224L16.0141 16.437C16.1943 17.0967 15.9531 17.7832 15.3999 18.1851C15.1123 18.394 14.7778 18.499 14.4424 18.499Z" fill="currentColor"/>
        </svg>`
      : `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5.51465 18.624C5.15332 18.624 4.79395 18.5117 4.48438 18.2861C3.8877 17.8535 3.62793 17.1143 3.82227 16.4033L4.78223 12.8906C4.87012 12.5713 4.75977 12.2314 4.50196 12.0244L1.65919 9.7461C1.08399 9.28614 0.859388 8.53516 1.08692 7.83497C1.31446 7.1338 1.93751 6.65919 2.67383 6.62403L6.3125 6.45118C6.64258 6.43556 6.93164 6.22559 7.04883 5.91602L8.33692 2.50879C8.59766 1.81934 9.24219 1.375 9.97852 1.375C10.7148 1.375 11.3594 1.82031 11.6191 2.50879L12.9082 5.91602C13.0254 6.22657 13.3135 6.43555 13.6445 6.45118L17.2832 6.62403C18.0195 6.65919 18.6416 7.1338 18.8691 7.83399C19.0967 8.53418 18.8731 9.28516 18.2988 9.7461L15.4551 12.0244C15.1973 12.2314 15.0869 12.5713 15.1738 12.8906L16.1348 16.4033C16.3291 17.1143 16.0693 17.8535 15.4736 18.2861C14.876 18.7178 14.0938 18.7373 13.4776 18.333L11.1074 16.7764C10.4307 16.334 9.51857 16.334 8.85158 16.7754L6.47756 18.333C6.18264 18.5274 5.84766 18.624 5.51465 18.624ZM9.97852 2.87501C9.91211 2.87501 9.79395 2.89649 9.73926 3.04005L8.45117 6.44728C8.12305 7.31642 7.31055 7.90626 6.38281 7.94923L2.74414 8.12208C2.59863 8.12892 2.53906 8.22169 2.51367 8.29786C2.48926 8.37501 2.4834 8.48438 2.59668 8.57618L5.43945 10.8545C6.16406 11.4346 6.47461 12.3897 6.22949 13.2852L5.26953 16.7988C5.22851 16.9473 5.3125 17.0342 5.36523 17.0723C5.42968 17.1191 5.53027 17.1592 5.65429 17.0791L8.02734 15.5225C9.18261 14.7617 10.7607 14.7569 11.9297 15.5225L14.3008 17.0791C14.4228 17.1582 14.5264 17.1201 14.5918 17.0723C14.6562 17.0254 14.7256 16.9395 14.6875 16.7998L13.7265 13.2861C13.4814 12.3897 13.792 11.4355 14.5176 10.8545L17.3603 8.57618C17.4795 8.48048 17.4629 8.36036 17.4424 8.29786C17.418 8.22169 17.3574 8.12891 17.2129 8.12208L13.5742 7.94923C12.6445 7.90626 11.833 7.31642 11.5049 6.4463L10.2168 3.03907C10.165 2.90333 10.0586 2.87501 9.97852 2.87501Z" fill="currentColor"/>
        </svg>`;

    // persist updated preferences
    this.userPrefs = userPrefs;
    await setConfig('sync', { pluginPrefs: this.userPrefs });
    await this.requestUpdate();
  }

  /**
   * Render a plugin menu item.
   * @param {SidekickPlugin} plugin The plugin
   * @returns {TemplateResult} The plugin menu item
   */
  renderPluginMenuItem(plugin) {
    const pinned = plugin.isPinned(this.getPluginPrefs(plugin.id));
    const disabled = !plugin.isEnabled();
    const pluginAction = (e) => {
      this.pluginMenuOverlay.removeAttribute('open');
      plugin.onButtonClick(e);
    };
    const toggleAction = (e) => this.togglePlugin(plugin, e);
    const toggleIcon = html`
      ${pinned ? ICONS.STAR_FULL : ICONS.STAR_EMPTY}
    `;
    const toggleTitle = pinned ? appStore.i18n('plugin_unpin') : appStore.i18n('plugin_pin');

    return html`
      <div class="menu-item-container">
        <sp-menu-item
          @click=${pluginAction}
          .disabled=${disabled}>
          <sp-icon slot="icon">
            ${ICONS.ADOBE_LOGO}
          </sp-icon>
          ${plugin.getButtonText()}
        </sp-menu-item>
        <sp-button
          quiet
          icon-only
          title="${toggleTitle}"
          @click=${toggleAction}>
          <sp-icon slot="icon">
            ${toggleIcon}
          </sp-icon>
        </sp-button>
      </div>`;
  }

  /**
   * Render the plugin menu.
   */
  renderPluginMenu() {
    if (appStore.status?.webPath && !this.pluginMenuOverlay) {
      const filterAction = (e) => this.filterPluginMenu(e.target.value);
      const filterPlaceholder = appStore.i18n('plugins_filter');
      const groupTitle = appStore.i18n('plugins');

      // add allowed non-container plugins
      const pluginList = this.allowedPlugins
        .filter((plugin) => plugin.getId() !== 'env-switcher' // special case: env-switcher
          && !plugin.isContainer());

      // include allowed children of container plugins
      this.allowedPlugins
        .filter((plugin) => plugin.isContainer())
        .forEach((container) => {
          Object.values(container.children)
            .filter((child) => child.isVisible())
            .forEach((child) => pluginList.push(child));
        });

      const menuItems = pluginList.map((plugin) => this.renderPluginMenuItem(plugin));

      this.pluginMenuOverlay = this.shadowRoot.querySelector('#plugin-list-overlay');
      render(html`
        <sp-popover role="presentation">
          <sp-menu id="plugin-list-menu" aria-labelledby="applied-label" role="listbox">
            <div class="filter-container">
              <sp-textfield
                quiet
                placeholder="${filterPlaceholder}"
                size="xl"
                @input=${filterAction}
              >
              </sp-textfield>
            </div>
            <sp-divider size="s"></sp-divider>
            <sp-menu-group id="plugin-list-plugins" selects="single">
              <span slot="header">${groupTitle}</span>
              ${menuItems}
            </sp-menu-group>
            <sp-divider size="s"></sp-divider>
            <div class="keyboard-hints">
              <div>
                <span>${appStore.i18n('plugins_navigate')}</span>
                <sp-icon size="s" style="transform: rotate(90deg)">
                  ${ICONS.ARROW}
                </sp-icon>
                <sp-icon size="s" style="transform: rotate(270deg)">
                  ${ICONS.ARROW}
                </sp-icon>
              </div>
              <div>
                <span>${appStore.i18n('plugins_select')}</span>
                <sp-icon size="s">
                  ${ICONS.ARROW}
                </sp-icon>
              </div>
              <div class="last">
                <span>${appStore.i18n('back')}</span>
                <sp-icon size="s">
                  esc
                </sp-icon>
              </div>
            </div>
          </sp-menu>
        </sp-popover>`, this.pluginMenuOverlay);
    }
  }

  /**
   * Render the core and custom plugins
   * @returns {(TemplateResult|string)|string} An array of Lit-html templates or strings, or a single empty string.
   */
  renderPlugins() {
    if (!appStore.corePlugins) {
      return '';
    }

    this.allowedPlugins = [
      ...Object.values(appStore.corePlugins),
      ...Object.values(appStore.customPlugins),
    ]
      .filter((plugin) => plugin.isVisible());

    const pinnedPlugins = this.allowedPlugins
      .filter((plugin) => plugin.isPinned(this.getPluginPrefs(plugin.id)));

    return pinnedPlugins.length > 0
      ? html`<sp-action-group>${[...pinnedPlugins.map((p) => p.render())]}</sp-action-group>`
      : '';
  }

  renderSystemPlugins() {
    const { profile } = appStore.status;
    const { siteStore } = appStore;

    const systemPlugins = [];

    const pluginList = html`
      <sp-action-button
        quiet
        id="plugin-list-trigger"
        title="${appStore.i18n('plugins_manage')}"
        @click=${() => this.renderPluginMenu()}>
        <sp-icon slot="icon" size="l">
          ${ICONS.PLUGINS}
        </sp-icon>
      </sp-action-button>
      <sp-overlay id="plugin-list-overlay" trigger="plugin-list-trigger@click"></sp-overlay>`;
    systemPlugins.push(pluginList);

    const properties = html`
      <sp-action-button class="properties" quiet>
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
        <login-button class=${authStatus}></login-button>
      `);
    }

    systemPlugins.push(ICONS.ADOBE_LOGO);

    const actionGroup = html`<sp-action-group>${systemPlugins}</sp-action-group>`;
    const divider = loggedIn || siteStore.authorized ? html`<sp-divider size="s" vertical></sp-divider>` : '';

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
