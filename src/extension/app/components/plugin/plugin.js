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

/* eslint-disable max-len */

import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { EXTERNAL_EVENTS } from '../../constants.js';

/**
 * @typedef {import('@AppStore').AppStore} AppStore
 */

/**
 * @typedef {import('@Types').CorePlugin} CorePlugin
 */

/**
 * @typedef {import('@Types').CustomPlugin} CustomPlugin
 */

/**
 * @typedef {import('../action-bar/picker/picker.js').Picker} Picker
 */

/**
 * @typedef ContainerPlugin
 * @property {Record<string, CorePlugin>} [children] The child plugins of the container
 */

/**
 * The lit template result type
 * @typedef {import('lit').TemplateResult} TemplateResult
 */

/**
 * Creates a sidekick plugin.
 * @param {CorePlugin|CustomPlugin} plugin The plugin configuration
 */
export class Plugin {
  /**
   * @type {AppStore}
   */
  appStore;

  /**
   * @type {Object<string, Plugin>}
   */
  children = {};

  /**
   * The plugin configuration
   * @property
   * @type {CustomPlugin}
   */
  config;

  constructor(plugin, appStore) {
    this.appStore = appStore;
    this.disabled = false;
    this.config = plugin;
    this.id = plugin.id;
  }

  /**
   * Returns the plugin ID.
   * @returns {string} The plugin ID
   */
  getId() {
    return this.config.id;
  }

  /**
   * Returns the plugin's button text.
   * @returns {string} The plugin's button text or ID
   */
  getButtonText() {
    return this.config.button?.text || this.getId();
  }

  /**
   * Is this plugin visible in the current environment?
   * @returns {boolean} True if plugin is visible, else false
   */
  isVisible() {
    return typeof this.config.condition !== 'function'
      || !!this.config.condition(this.appStore);
  }

  /**
   * Is this plugin enabled for the current resource?
   * @returns {boolean} True if plugin is enabled, else false
   */
  isEnabled() {
    return typeof this.config.button?.isEnabled !== 'function'
      || this.config.button.isEnabled(this.appStore);
  }

  /**
   * Is this plugin pinned to the sidekick's action bar?
   * @returns {boolean} True if plugin is pinned, else false
   */
  isPinned() {
    if (typeof this.config.pinned === 'boolean') {
      // use default from config if defined
      return this.config.pinned;
    } else {
      // assume pinned if no user preference or config default
      return true;
    }
  }

  /**
   * Is this plugin a container?
   * @returns {boolean} True if the plugin is a container, else false
   */
  isContainer() {
    return Object.keys(this.children).length > 0;
  }

  /**
   * Is this plugin a child of another plugin?
   * @returns {boolean} True if the plugin is a child, else false
   */
  isChild() {
    return !!this.config.container;
  }

  /**
   * Returns the parent plugin ID.
   * @returns {string} The parent plugin ID
   */
  getContainerId() {
    return this.config.container;
  }

  /**
   *  Is this plugin a badge?
   * @returns {boolean} True if the plugin elements array has exactly one element and that element is a badge, otherwise false.
   */
  isBadge() {
    return this.config.isBadge;
  }

  /**
   * Is this plugin a popover?
   * @returns {boolean} True if the plugin is a popover
   */
  isPopover() {
    return this.config.isPopover;
  }

  /**
   * Adds a plugin to this plugin's children.
   * @param {Plugin} plugin The plugin to add
   */
  append(plugin) {
    this.children[plugin.id] = plugin;
  }

  /**
   * Returns the estimated width of the plugin button.
   * @returns {number} The estimated width of the plugin button
   */
  getEstimatedWidth() {
    const font = '14px Adobe Clean';
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = font;
    let pluginWidth = context.measureText(this.getButtonText()).width + 24;
    if (this.isContainer()) {
      pluginWidth += 14;
    }
    return pluginWidth;
  }

  /**
   * Executes the plugin's button action.
   * @param {Event} evt The event object
   */
  async onButtonClick(evt) {
    const { config, id } = this;
    await this.appStore.validateSession();
    this.appStore.fireEvent(EXTERNAL_EVENTS.PLUGIN_USED, id);
    config.button.action(evt);
  }

  /**
   * Handles the environment switcher change event
   * @private
   * @param {Event & { target: Picker }} event - The event object with target typed as Picker
   */
  onChange(event) {
    const { target } = event;

    const selectedPlugin = this.children[target.value];
    selectedPlugin.onButtonClick(event);

    // Prevent the picker from showing the selected item
    target.value = '';
    target.selectedItem = undefined;
  }

  /**
   * Returns the rendered plugin.
   * @returns {string|TemplateResult} The rendered plugin
   */
  render() {
    const { config } = this;
    if (typeof config.callback === 'function') {
      config.callback(this.appStore, config);
    }

    // special case: env-switcher
    if (this.getId() === 'env-switcher') {
      return html`
        <env-switcher></env-switcher>
      `;
    }

    if (this.isBadge()) {
      return html`
        <sp-badge
          class=${this.getId()}
          size="s"
          variant="${this.config.badgeVariant || 'default'}"
        >${this.getButtonText()}</sp-badge>
      `;
    }

    if (this.isPinned()) {
      const childPlugins = Object.values(this.children)
        .filter((childPlugin) => childPlugin.isVisible() && childPlugin.isPinned());

      if (this.isContainer()) {
        if (childPlugins.length > 0) {
          return html`
            <action-bar-picker
              quiet
              class=${`plugin-container ${this.getId()}`}
              label=${this.getButtonText()}
              @change=${(e) => this.onChange(e)}
              placement="top"
            >${childPlugins.map((childPlugin) => childPlugin.render())}</action-bar-picker>
          `;
        } else {
          return '';
        }
      } else if (this.isChild()) {
        return html`
          <sk-menu-item
            .disabled=${!this.isEnabled()}
            value=${this.getId()}
            class=${this.getId()}
            @click=${(evt) => this.onButtonClick(evt)}
          >${this.getButtonText()}</sk-menu-item>
        `;
      }

      if (this.isPopover() && this.config.url) {
        const { siteStore } = this.appStore;
        const {
          url, popoverRect, title, titleI18n,
          passConfig, passReferrer,
        } = this.config;

        const popoverTitle = titleI18n?.[this.appStore.siteStore.lang] || title;
        const src = new URL(url);
        src.searchParams.set('theme', this.appStore.theme);

        if (passConfig) {
          src.searchParams.append('ref', siteStore.ref);
          src.searchParams.append('repo', siteStore.repo);
          src.searchParams.append('owner', siteStore.owner);
          if (siteStore.host) src.searchParams.append('host', siteStore.host);
          if (siteStore.reviewHost) src.searchParams.append('reviewHost', siteStore.reviewHost);
          if (siteStore.project) src.searchParams.append('project', siteStore.project);
        }
        if (passReferrer) {
          src.searchParams.append('referrer', this.appStore.location.href);
        }

        let filteredPopoverRect = popoverRect;
        if (popoverRect) {
          filteredPopoverRect = `${popoverRect
            .split(';')
            .map((s) => s.trim())
            .filter((s) => s.startsWith('width:') || s.startsWith('height:'))
            .join('; ')};`;
        }

        return html`
          <overlay-trigger receivesFocus="true" offset="-3">
            <sp-action-button quiet slot="trigger">${this.getButtonText()}</sp-action-button>
            <sp-popover slot="click-content" placement="top" tip style=${ifDefined(filteredPopoverRect)}>
              <div class="content">
                <iframe title=${popoverTitle || 'Popover content'} src=${src}></iframe>
              </div>
            </sp-popover>
          </overlay-trigger>`;
      }

      return html`
        <sp-action-button
          class=${this.getId()}
          .disabled=${!this.isEnabled()}
          quiet
          @click=${(evt) => this.onButtonClick(evt)}
        >
          ${this.getButtonText()}
        </sp-action-button>
      `;
    }

    return '';
  }
}
