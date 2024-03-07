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

import { html, css } from 'lit';
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

  constructor(plugin) {
    this.disabled = false;
    this.config = plugin;
    this.id = plugin.id;
  }

  /**
   * Checks the plugin's condition.
   * @returns {boolean} True if plugin's condition is met, else false
   */
  checkCondition() {
    return !this.config.condition || !!this.config.condition(this.config.appStore);
  }

  /**
   * Returns the pinned state of the plugin.
   * @param {Object} [userPrefs] The user preferences for this plugin
   * @returns {boolean} True if plugin is pinned, else false
   */
  isPinned(userPrefs = {}) {
    if (typeof userPrefs.pinned === 'boolean') {
      // use user preference if defined
      return userPrefs.pinned;
    } else if (typeof this.config.pinned === 'boolean') {
      // use default from config if defined
      return this.config.pinned;
    } else {
      // assume pinned if no user preference or config default
      return true;
    }
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
   * @private
   * @param {Event} evt The event object
   */
  async onButtonClick(evt) {
    const { config, id } = this;
    await config.appStore.validateSession();
    config.appStore.fireEvent(EXTERNAL_EVENTS.PLUGIN_USED, { id });
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
   * @returns {TemplateResult} The rendered plugin
   */
  render() {
    const { config } = this;
    if (typeof config.callback === 'function') {
      config.callback(config.appStore, config);
    }

    // special case: env-switcher
    if (config.id === 'env-switcher') {
      return html`
        <env-switcher></env-switcher>
      `;
    }

    const childConfigs = Object.values(this.children)
      .filter((childPlugin) => childPlugin.checkCondition()
        && childPlugin.isPinned())
      .map((childPlugin) => childPlugin.config);

    if (childConfigs.length > 0) {
      return html`
        <action-bar-picker 
          class=${`plugin-container ${config.id}`} 
          label=${config.button.text} 
          @change=${(e) => this.onChange(e)} 
          placement="top"
        >
        ${childConfigs.map((childConfig) => html`
            <sp-menu-item value=${childConfig.id}>${childConfig.button.text}</sp-menu-item>
          `)}
        </action-bar-picker>
      `;
    }

    const isEnabled = typeof config.button?.isEnabled === 'function'
      ? config.button.isEnabled : () => true;

    return html`
      <sp-action-button 
        class=${config.id} 
        .disabled=${!isEnabled(config.appStore)} 
        quiet 
        @click=${(evt) => this.onButtonClick(evt)}
      >
          ${config.button.text}
      </sp-action-button>
    `;
  }
}
