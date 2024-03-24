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
import { appStore } from '../../store/app.js';
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
export class SidekickPlugin {
  /**
   * @type {Object<string, SidekickPlugin>}
   */
  children = {};

  /**
   * The plugin configuration
   * @property
   * @type {Object}
   */
  config;

  constructor(plugin) {
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
      || !!this.config.condition(appStore);
  }

  /**
   * Is this plugin enabled for the current resource?
   * @returns {boolean} True if plugin is enabled, else false
   */
  isEnabled() {
    return typeof this.config.button?.isEnabled !== 'function'
      || this.config.button.isEnabled(appStore);
  }

  /**
   * Is this plugin pinned to the sidekick's action bar?
   * @returns {boolean} True if plugin is pinned, else false
   */
  isPinned() {
    const prefs = appStore.getPluginPrefs(this.getId());
    if (typeof prefs.pinned === 'boolean') {
      // use user preference if defined
      return prefs.pinned;
    } else if (typeof this.config.pinned === 'boolean') {
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
  getParentId() {
    return this.config.container;
  }

  /**
   * Adds a plugin to this plugin's children.
   * @param {SidekickPlugin} plugin The plugin to add
   */
  append(plugin) {
    this.children[plugin.id] = plugin;
  }

  /**
   * Executes the plugin's button action.
   * @param {Event} evt The event object
   */
  async onButtonClick(evt) {
    const { config, id } = this;
    await appStore.validateSession();
    appStore.fireEvent(EXTERNAL_EVENTS.PLUGIN_USED, { id });
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
      config.callback(appStore, config);
    }

    // special case: env-switcher
    if (this.getId() === 'env-switcher') {
      return html`
        <env-switcher></env-switcher>
      `;
    }

    if (this.isPinned()) {
      const childPlugins = Object.values(this.children)
        .filter((childPlugin) => childPlugin.isVisible() && childPlugin.isPinned());

      if (this.isContainer()) {
        if (childPlugins.length > 0) {
          return html`
            <action-bar-picker 
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
          <sp-menu-item
            .disabled=${!this.isEnabled()}
            value=${this.getId()}
            @click=${(evt) => this.onButtonClick(evt)}
          >${this.getButtonText()}</sp-menu-item>
        `;
      }

      return html`
        <sp-action-button 
          class=${this.getId()} 
          .disabled=${!this.isEnabled()} 
          quiet 
          @click=${(evt) => this.onButtonClick(evt)}
        >${this.getButtonText()}</sp-action-button>
      `;
    }

    return '';
  }
}
