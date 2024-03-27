/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { customElement, property, query } from 'lit/decorators.js';
import { reaction } from 'mobx';
import { html, LitElement } from 'lit';
import { appStore } from '../../../store/app.js';
import { style } from './plugin-list.css.js';
import { ICONS } from '../../../constants.js';

/**
 * @typedef {import('../../plugin/plugin.js').Plugin} SidekickPlugin
 */

/**
 * The lit template result type
 * @typedef {import('lit').TemplateResult} TemplateResult
 */

/**
 * Plugin List component
 * @element plugin-list
 * @class PluginList
 */
@customElement('plugin-list')
export class PluginList extends LitElement {
  static get styles() {
    return [
      style,
    ];
  }

  /**
   * All plugins visible in the current environment.
   * @type {SidekickPlugin[]}
   */
  visiblePlugins = [];

  /**
   * The subset of all plugins to list.
   * @type {SidekickPlugin[]}
   */
  listedPlugins = [];

  /**
   * The filter field.
   * @type {HTMLInputElement}
   */
  @query('sp-textfield')
  accessor filterField;

  /**
   * The filter text.
   * @type {string}
   */
  @property({ type: String })
  accessor filterText = '';

  /**
   * Are we ready to enable?
   * @type {Boolean}
   */
  @property({ type: Boolean })
  accessor ready = false;

  connectedCallback() {
    super.connectedCallback();

    reaction(
      () => appStore.status,
      () => {
        this.ready = true;
        this.requestUpdate();
      },
    );

    this.ready = true;
  }

  async firstUpdated() {
    (await this.filterField)?.focus();
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
   * Render a list item.
   * @param {SidekickPlugin} plugin The plugin
   * @returns {string|TemplateResult} The list item
   */
  renderListItem(plugin) {
    // apply filter if present
    if (this.filterText && (!plugin.getButtonText().toLowerCase().includes(this.filterText)
        || !plugin.getId().toLowerCase().includes(this.filterText))) {
      return '';
    }

    const pinned = plugin.isPinned();
    const disabled = !plugin.isEnabled();
    const pluginAction = (e) => {
      plugin.onButtonClick(e);
      this.dispatchEvent(new CustomEvent('close'));
    };

    let parentPluginText = '';
    if (plugin.isChild()) {
      parentPluginText = this.visiblePlugins
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
   * Render the filter field.
   * @returns {TemplateResult} The filter field
   */
  renderFilter() {
    const filterAction = (e) => {
      this.filterText = e.target.value.toLowerCase();
    };
    const filterPlaceholder = appStore.i18n('plugins_filter');

    return html`
    <div class="filter-container">
      <sp-textfield
        quiet
        size="xl"
        placeholder="${filterPlaceholder}"
        id="plugin-filter"
        @input=${(filterAction)}
      ></sp-textfield>
    </div>
    `;
  }

  /**
   * Render the keyboard hints.
   * @returns {TemplateResult} The keyboard hints
   */
  renderKeyboardHints() {
    return html`
      <div class="keyboard-hints-container">
      <div>
        <span>${appStore.i18n('plugins_navigate')}</span>
        <sp-icon size="s">
          tab
        </sp-icon>
        +
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
          ${ICONS.RETURN}
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
   * Render the plugin list.
   * @returns {TemplateResult} The plugin list
   */
  renderList() {
    // gather the plugins
    this.visiblePlugins = [
      ...Object.values(appStore.corePlugins),
      ...Object.values(appStore.customPlugins),
    ]
      .filter((plugin) => plugin.isVisible());

    // list the non-container plugins
    this.listedPlugins = this.visiblePlugins
      .filter((plugin) => plugin.getId() !== 'env-switcher' // special case: env-switcher
        && !plugin.isContainer());

    // list children of container plugins
    this.visiblePlugins
      .filter((plugin) => plugin.isContainer())
      .forEach((container) => {
        Object.values(container.children)
          .filter((child) => child.isVisible())
          .forEach((child) => this.listedPlugins.push(child));
      });

    return html`
      <div class="plugin-list-container">
        ${this.renderFilter()}
        <sp-divider size="s"></sp-divider>
        <sp-menu id="plugin-list-menu" aria-labelledby="applied-label" role="listbox">
          <sp-menu-group id="plugin-list-plugins" selects="single">
            <span slot="header">${appStore.i18n('plugins')}</span>
            ${this.listedPlugins.map((plugin) => this.renderListItem(plugin))}
          </sp-menu-group>
          </sp-menu>
        <sp-divider size="s"></sp-divider>
        ${this.renderKeyboardHints()}
      </div>
    `;
  }

  render() {
    return this.ready && appStore.status?.webPath ? this.renderList() : '';
  }
}
