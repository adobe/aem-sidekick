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
import { customElement, property } from 'lit/decorators.js';
import { MobxLitElement } from '@adobe/lit-mobx';
import { reaction } from 'mobx';
import { appStore } from '../../store/app.js';
import { ICONS, MODALS } from '../../constants.js';
import { style } from './plugin-action-bar.css.js';

/**
 * @typedef {import('../plugin/plugin.js').Plugin} SidekickPlugin
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
   * The core and custom plugins visible in the current environment.
   * @type {SidekickPlugin[]}
   */
  visiblePlugins = [];

  /**
   * The modal container.
   * @type {HTMLElement}
   */
  modalContainer = null;

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
   * Render the core and custom plugins
   * @returns {(TemplateResult|string)|string} An array of Lit-html templates or strings, or a single empty string.
   */
  renderPlugins() {
    if (!appStore.corePlugins) {
      return '';
    }

    this.visiblePlugins = [
      ...Object.values(appStore.corePlugins),
      ...Object.values(appStore.customPlugins),
    ]
      .filter((plugin) => plugin.isVisible());

    return this.visiblePlugins.length > 0
      ? html`<sp-action-group>${[...this.visiblePlugins.map((p) => p.render())]}</sp-action-group>`
      : '';
  }

  /**
   * Removes the modal container.
   */
  removeModalContainer() {
    this.modalContainer.remove();
    this.modalContainer = null;
  }

  /**
   * Toggles the plugin list dialog.
   */
  togglePluginListDialog() {
    if (this.modalContainer) {
      this.removeModalContainer();
    } else {
      this.modalContainer = appStore.showModal({ type: MODALS.PLUGIN_LIST });
    }
  }

  renderSystemPlugins() {
    const { profile } = appStore.status;
    const { siteStore } = appStore;

    const systemPlugins = [];

    const pluginList = html`
      <sp-action-button
        quiet
        toggles
        class="plugin-list"
        label="${appStore.i18n('plugins_manage')}"
        .disabled=${!appStore.status?.webPath}
        @click=${this.togglePluginListDialog}>
        <sp-icon slot="icon" size="l">
          ${ICONS.PLUGINS}
        </sp-icon>
      </sp-action-button>`;
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
