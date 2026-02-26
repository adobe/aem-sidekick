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
import { EVENTS, EXTERNAL_EVENTS } from '../../constants.js';
import { EventBus } from '../../utils/event-bus.js';

/**
 * @typedef {import('@spectrum-web-components/popover').Popover} Popover
 */

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

  /**
   * Reference to the popover element for resizing and closing
   * @type {Popover}
   */
  popoverElement;

  constructor(plugin, appStore) {
    this.appStore = appStore;
    this.disabled = false;
    this.config = plugin;
    this.id = plugin.id;

    // Listen for popover resize events
    if (this.isPopover()) {
      EventBus.instance.addEventListener(EVENTS.RESIZE_POPOVER, (e) => {
        if (!this.popoverElement || !this.popoverElement.open) {
          return;
        }
        const { id, styles } = e.detail;
        if (this.id === id && styles) {
          this.popoverElement.setAttribute('style', this.#filterUserStyles(styles));
          // Re-render
          this.popoverElement.open = true;
        }
      });
    }
  }

  /**
   * Filters out unsupported user-provided styles.
   * @param {string} styles The user-provided styles
   * @return {string} The filtered styles
   */
  #filterUserStyles(styles = '') {
    return `${styles
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.startsWith('width:') || s.startsWith('height:'))
      .join('; ')};`;
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
   * Initializes the popover
   */
  initPopover(evt) {
    const { target } = evt;
    const iframe = target.parentElement.querySelector(':scope iframe');
    if (!iframe?.src) {
      // set iframe src to the popover url
      iframe.src = this.config.url;
    }
    // Store reference to the popover for later closing
    this.popoverElement = target.parentElement.querySelector('sp-popover');
  }

  /**
   * Closes this plugin's popover if it's open
   */
  closePopover() {
    if (!this.isPopover() || !this.popoverElement) {
      return;
    }

    if (this.popoverElement.open) {
      this.popoverElement.dispatchEvent(new Event('close', { bubbles: true }));
    }
  }

  /**
   * Renders the plugin with a popover.
   * @param {TemplateResult} template The plugin template to wrap
   * @param {string} [placement] The placement of the popover (default: 'top')
   * @returns {TemplateResult} The rendered popover
   */
  #renderWithPopover(template, placement = 'top') {
    const {
      popoverRect, title, titleI18n,
    } = this.config;

    const popoverTitle = titleI18n?.[this.appStore.siteStore.lang] || title;

    let filteredPopoverRect;
    if (popoverRect) {
      filteredPopoverRect = this.#filterUserStyles(popoverRect);
    }

    return html`
      <overlay-trigger receivesFocus="true" offset="-3">
        ${template}
        <sp-popover slot="click-content" placement="${placement}" tip style=${ifDefined(filteredPopoverRect)}>
          <div class="content">
            <iframe allow="clipboard-write *" title=${popoverTitle || 'Popover content'}></iframe>
          </div>
        </sp-popover>
      </overlay-trigger>
    `;
  }

  /**
   * Renders the plugin as a menu item.
   * @returns {string|TemplateResult} The rendered plugin
   */
  renderMenuItem() {
    const menuItem = html`
      <sk-menu-item
        .disabled=${!this.isEnabled()}
        value=${this.getId()}
        class=${this.getId()}
        tabindex="0"
        slot=${this.isPopover() ? 'trigger' : ''}
        @click=${this.isPopover()
          ? (evt) => this.initPopover(evt)
          : (evt) => this.onButtonClick(evt)}
      >${this.getButtonText()}</sk-menu-item>
    `;
    return this.isPopover() ? this.#renderWithPopover(menuItem, 'left') : menuItem;
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
        return this.renderMenuItem();
      }

      const actionButton = html`
        <sp-action-button
          class=${this.getId()}
          .disabled=${!this.isEnabled()}
          quiet
          slot=${this.isPopover() ? 'trigger' : ''}
          @click=${this.isPopover()
            ? (evt) => this.initPopover(evt)
            : (evt) => this.onButtonClick(evt)}
        >${this.getButtonText()}</sp-action-button>
      `;
      return this.isPopover() ? this.#renderWithPopover(actionButton) : actionButton;
    }

    return '';
  }
}
