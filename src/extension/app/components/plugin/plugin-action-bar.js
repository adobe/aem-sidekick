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
import { customElement, queryAsync } from 'lit/decorators.js';
import { reaction } from 'mobx';
import { ICONS, MODALS, SIDEKICK_STATE } from '../../constants.js';
import { style } from './plugin-action-bar.css.js';
import { ConnectedElement } from '../connected-element/connected-element.js';
import '../action-bar/activity-action/activity-action.js';

/**
 * @typedef {import('../plugin/plugin.js').Plugin} SidekickPlugin
 */

/**
 * The lit template result type
 * @typedef {import('lit').TemplateResult} TemplateResult
 */

@customElement('plugin-action-bar')
export class PluginActionBar extends ConnectedElement {
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

  @queryAsync('action-bar')
  accessor actionBar;

  /**
   * Loads the user preferences for plugins in this environment.
   */
  async connectedCallback() {
    super.connectedCallback();

    this.ready = true;

    reaction(
      () => this.appStore.state,
      async () => {
        const actionBar = await this.actionBar;
        if (this.appStore.state === SIDEKICK_STATE.TOAST) {
          actionBar.classList.add(this.appStore.toast.variant);

          setTimeout(() => {
            actionBar.className = '';
            if (this.appStore.toast?.actionCallback) {
              this.appStore.toast?.actionCallback();
            }
            this.appStore.closeToast();
          }, this.appStore.toast.timeout);
          // We need to reset the class name to remove the toast variant, but only if it exists.
          // It's possible for actionBar to be null on the first render.
        } else if (actionBar) {
          actionBar.className = '';
        }

        this.requestUpdate();
      },
    );
  }

  /**
   * Render the core and custom plugins
   * @returns {(TemplateResult|string)|string} An array of Lit-html templates or strings, or a single empty string.
   */
  renderPlugins() {
    if (this.appStore.state !== SIDEKICK_STATE.READY) {
      return html`
        <sp-action-group>
          <activity-action></activity-action>
        </sp-action-group>`;
    }

    this.visiblePlugins = [
      ...Object.values(this.appStore.corePlugins),
      ...Object.values(this.appStore.customPlugins),
    ]
      .filter((plugin) => plugin.isVisible());

    return this.visiblePlugins.length > 0
      ? html`<sp-action-group>${this.visiblePlugins.map((p) => p.render())}</sp-action-group>`
      : html`<sp-action-group></sp-action-group>`;
  }

  /**
   * Shows the plugin list modal.
   */
  showPluginListModal() {
    this.appStore.showModal({ type: MODALS.PLUGIN_LIST });
  }

  renderSystemPlugins() {
    const { profile } = this.appStore.status;
    const { siteStore } = this.appStore;

    const systemPlugins = [];

    if (this.appStore.state === SIDEKICK_STATE.TOAST) {
      return html``;
    }

    const pluginList = html`
      <sp-action-button
        quiet
        class="plugin-list"
        label="${this.appStore.i18n('plugins_manage')}"
        .disabled=${!this.appStore.status?.webPath}
        @click=${this.showPluginListModal}>
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
    const divider = html`<sp-divider size="s" vertical></sp-divider>`;

    return [divider, actionGroup];
  }

  render() {
    return this.appStore.state !== SIDEKICK_STATE.INITIALIZING ? html`
      <action-bar>
        ${this.renderPlugins()}
        ${this.renderSystemPlugins()}
      </action-bar>
    ` : '';
  }
}
