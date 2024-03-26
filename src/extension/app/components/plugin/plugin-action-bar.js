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
   * The core and custom plugins allowed in the current environment.
   * @type {SidekickPlugin[]}
   */
  allowedPlugins = [];

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

    this.ready = true;

    reaction(
      () => appStore.status,
      () => {
        this.requestUpdate();
      },
    );
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
    const pluginPrefs = appStore.getPluginPrefs(plugin.getId());

    // flip the pinned state
    const newPinnedState = !plugin.isPinned();
    pluginPrefs.pinned = newPinnedState;

    // toggle button state
    button.setAttribute('title', newPinnedState
      ? appStore.i18n('plugin_unpin')
      : appStore.i18n('plugin_pin'));
    const icon = button.querySelector('sp-icon');
    icon.innerHTML = (newPinnedState ? ICONS.STAR_FULL : ICONS.STAR_EMPTY).strings.join('');

    // persist updated preferences
    await appStore.setPluginPrefs(plugin.getId(), pluginPrefs);
  }

  /**
   * Render the keyboard hints for the plugin menu.
   * @returns {TemplateResult} The plugin menu item
   */
  renderPluginMenuKeyboardHints() {
    return html`
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
  `;
  }

  /**
   * Render a plugin menu item.
   * @param {SidekickPlugin} plugin The plugin
   * @returns {TemplateResult} The plugin menu item
   */
  renderPluginMenuItem(plugin) {
    const pinned = plugin.isPinned();
    const disabled = !plugin.isEnabled();
    const pluginAction = (e) => {
      this.pluginMenuOverlay.removeAttribute('open');
      plugin.onButtonClick(e);
    };

    let parentPluginText = '';
    if (plugin.isChild()) {
      parentPluginText = this.allowedPlugins
        .find((p) => p.getId() === plugin.getParentId())
        ?.getButtonText();
    }
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
          <span class="parent">${parentPluginText}</span>
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
            ${this.renderPluginMenuKeyboardHints()}
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

    return this.allowedPlugins.length > 0
      ? html`<sp-action-group>${[...this.allowedPlugins.map((p) => p.render())]}</sp-action-group>`
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
        .disabled=${!appStore.status?.webPath}
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
