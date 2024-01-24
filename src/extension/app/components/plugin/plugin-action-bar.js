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

import { html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { MobxLitElement } from '@adobe/lit-mobx';
import { appStore } from '../../store/app.js';
import { EXTERNAL_EVENTS } from '../../constants.js';

const logo = new URL('../../../icons/adobe-logo.svg', import.meta.url).href;

/**
 * @typedef {import('@Types').CorePlugin} CorePlugin
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

@customElement('plugin-action-bar')
export class PluginActionBar extends MobxLitElement {
  static styles = css`
    action-bar sp-action-group {
      padding: 8px;
    }

    action-bar .plugin-container {
      width: auto;
    }

    action-bar sp-action-group .logo {
      width: 32px;
      height: 32px;
    }
  `;

  /**
   *
   * @param {CorePlugin} plugin
   * @returns
   */
  createCorePlugin(plugin) {
    if (typeof plugin.callback === 'function') {
      plugin.callback(appStore, plugin);
    }

    if (plugin.id === 'env-switcher') {
      return html`
        <env-switcher></env-switcher>
      `;
    }

    return html`
      <sp-action-button class=${plugin.id} quiet @click=${(evt) => this.onPluginButtonClick(evt, plugin)}>
          ${plugin.button.text}
      </sp-action-button>
    `;
  }

  onPluginButtonClick(evt, plugin) {
    appStore.fireEvent(EXTERNAL_EVENTS.PLUGIN_USED, {
      id: plugin.id,
    });
    plugin.button.action(evt);
  }

  /**
   * Handles the environment switcher change event
   * @param {Event & { target: Picker }} event - The event object with target typed as Picker
   */
  onChange(event, plugin) {
    const { target } = event;

    const selectedPlugin = plugin.children[target.value];
    selectedPlugin.button.action(event);

    // Prevent the picker from showing the selected item
    target.value = '';
    target.selectedItem = undefined;
  }

  /**
   * Render the core and custom plugins
   * @returns {(TemplateResult|string)[]|string} An array of Lit-html templates or strings, or a single empty string.
   */
  renderPlugins() {
    if (appStore.corePlugins) {
      const corePlugins = Object.values(appStore.corePlugins)?.map((plugin) => (plugin.condition(appStore) ? this.createCorePlugin(plugin) : ''));

      /**
       * @type {Record<string, CorePlugin & ContainerPlugin>}
       * */
      const customPlugins = {};
      Object.values(appStore.customPlugins).forEach((plugin) => {
        if (plugin.button.isDropdown) {
          customPlugins[plugin.id] = plugin;
        } else if (plugin.container) {
          const container = customPlugins[plugin.container];
          if (!container.children) {
            container.children = {};
          }
          container.children[plugin.id] = plugin;
        } else {
          customPlugins[plugin.id] = plugin;
        }
      });

      const userPlugins = Object.values(customPlugins).map((plugin) => {
        if (plugin.children) {
          return html`
            <action-bar-picker class=${`plugin-container ${plugin.id}`} label=${plugin.button.text} @change=${(e) => this.onChange(e, plugin)}>
              ${Object.values(plugin.children).map((childPlugin) => (childPlugin.condition(appStore)
                  ? html`<sp-menu-item value=${childPlugin.id}>${childPlugin.button.text}</sp-menu-item>`
                  : ''))}
            </action-bar-picker>
          `;
        }

        return plugin.condition(appStore) ? html`
                <sp-action-button class=${plugin.id} quiet @click=${(evt) => this.onPluginButtonClick(evt, plugin)}>
                  ${plugin.button.text || plugin.id}
                </sp-action-button>
              ` : '';
      });

      return [...corePlugins, ...userPlugins];
    }

    return '';
  }

  render() {
    return appStore.initialized ? html`
      <action-bar>
        <sp-action-group>
          <img class="logo" alt="adobe logo" src=${logo} />
          <sp-divider size="s" vertical></sp-divider>
          ${this.renderPlugins()}
        </sp-action-group>
        <sp-divider size="s" vertical></sp-divider>
        <sp-action-group>
          <sp-action-button quiet aria-label="profile">
            <sp-icon-real-time-customer-profile slot="icon"></sp-icon-real-time-customer-profile>
          </sp-action-button>
        </sp-action-group>
      </action-bar>
    ` : '';
  }
}
