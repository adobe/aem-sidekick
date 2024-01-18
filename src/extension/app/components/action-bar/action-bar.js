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

import { html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { MobxLitElement } from '@adobe/lit-mobx';
import { appStore } from '../../store/app.js';
import { style } from './action-bar.css.js';
import { EXTERNAL_EVENTS } from '../../constants.js';

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

@customElement('action-bar')
export class ActionBar extends MobxLitElement {
  static get styles() {
    return [style];
  }

  /**
   *
   * @param {CorePlugin} plugin
   * @returns
   */
  createActionPluginButton(plugin) {
    if (typeof plugin.callback === 'function') {
      plugin.callback(appStore, plugin);
    }

    if (plugin.id === 'env-switcher') {
      return html`
        <env-switcher></env-switcher>
      `;
    }

    return html`
      <sp-action-button quiet @click=${(evt) => this.onPluginButtonClick(evt, plugin)}>
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

  renderPlugins() {
    if (appStore.corePlugins) {
      const corePlugins = Object.values(appStore.corePlugins)?.map((plugin) => (plugin.condition(appStore) ? this.createActionPluginButton(plugin) : ''));

      /**
       * @type {Record<string, CorePlugin & ContainerPlugin>}
       * */
      const customPlugins = {};
      if (appStore.customPlugins) {
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
      }

      const userPlugins = Object.values(customPlugins).map((plugin) => {
        if (plugin.children) {
          return html`
            <action-bar-picker class="plugin-container" label=${plugin.button.text} @change=${(e) => this.onChange(e, plugin)}>
              ${Object.values(plugin.children).map((childPlugin) => (childPlugin.condition(appStore)
                  ? html`<sp-menu-item value=${childPlugin.id}>${childPlugin.button.text}</sp-menu-item>`
                  : ''))}
            </action-bar-picker>
          `;
        }

        return plugin.condition(appStore) ? html`
                <sp-action-button quiet @click=${(evt) => this.onPluginButtonClick(evt, plugin)}>
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
      <div class="action-bar">
        <sp-action-group>
          ${this.renderPlugins()}
        </sp-action-group>
        <sp-divider size="s" vertical></sp-divider>
        <sp-action-group>
          <sp-action-button quiet>
            <sp-icon-real-time-customer-profile slot="icon"></sp-icon-real-time-customer-profile>
          </sp-action-button>
        </sp-action-group>
      </div>
    ` : '';
  }
}
