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

import { customElement, property, query } from 'lit/decorators.js';
import { reaction } from 'mobx';
import { html } from 'lit';
import { MobxLitElement } from '@adobe/lit-mobx';
import { style } from './config-switcher.css.js';
import { appStore } from '../../../store/app.js';
import { createTag } from '../../../utils/browser.js';

/**
 * @typedef {import('../../action-bar/picker/picker.js').Picker} Picker
 */

/**
 * @typedef {import('@Types').SidekickOptionsConfig} SidekickOptionsConfig
 */

/**
 * Config Switcher component
 * @element config-switcher
 * @class ConfigSwitcher
 */
@customElement('config-switcher')
export class ConfigSwitcher extends MobxLitElement {
  /**
   * The picker element
   * @type {Picker}
   */
  @query('action-bar-picker')
  accessor picker;

  /**
   * The currently active config
   */
  @property({ type: Object })
  accessor currentConfig;

  /**
   * Are we ready to enable?
   * @type {Boolean}
   */
  @property({ type: Boolean })
  accessor ready = false;

  static get styles() {
    return [style];
  }

  connectedCallback() {
    super.connectedCallback();

    reaction(
      () => appStore.status,
      () => {
        this.renderMenu();
      },
    );
  }

  /**
   * Called on first render
   */
  firstUpdated() {
    const { siteStore } = appStore;
    const { owner, repo, ref } = siteStore;
    siteStore.configMatches.forEach((config) => {
      if (config.owner === owner && config.repo === repo && config.ref === ref) {
        this.currentConfig = config;
      }
    });

    this.picker.label = this.currentConfig.repo;
    this.picker.classList.add('config-switcher');

    this.renderMenu();
  }

  /**
   * Creates a menu item with specified attributes and a description.
   *
   * @param {SidekickOptionsConfig} config - The id of the plugin
   * @returns {HTMLElement} - The created menu item
   */
  createMenuItem(config) {
    const { id, repo, owner } = config;
    const menuItem = createTag({
      tag: 'sp-menu-item',
      text: repo,
      attrs: {
        value: id,
        class: `config-${id}`,
      },
    });

    const description = createTag({
      tag: 'span',
      text: owner,
      attrs: {
        slot: 'description',
      },
    });

    menuItem.appendChild(description);

    return menuItem;
  }

  /**
   * Creates a "Projects" header
   * @returns {HTMLElement} The created header
   */
  createProjectsHeader() {
    const menuItem = createTag({
      tag: 'div',
      text: appStore.i18n('config_projects'),
      attrs: {
        class: 'heading',
      },
    });

    return menuItem;
  }

  /**
   * Renders the environment switcher menu
   */
  renderMenu() {
    const { picker } = this;

    // Reset contents of picker
    picker.innerHTML = '';

    const projectsHeader = this.createProjectsHeader();

    picker.append(projectsHeader);

    const { siteStore } = appStore;
    siteStore.configMatches.forEach((config) => {
      picker.append(this.createMenuItem(config));
    });

    if (appStore.status?.webPath) {
      this.ready = true;
    }
  }

  /**
   * Handles the config switcher change event
   */
  onChange() {
    const { picker } = this;
    const { value } = picker;

    const [owner, repo, ref] = value.split('/');
    const { siteStore } = appStore;
    siteStore.configMatches.forEach((config) => {
      if (config.owner === owner && config.repo === repo && config.ref === ref) {
        window.sessionStorage.setItem('hlx-sk-project', JSON.stringify(config));
        siteStore.initStore(config);
      }
    });
  }

  render() {
    return html`<action-bar-picker placement="top" selects="single" value=${this.currentConfig?.id} @change=${this.onChange} .disabled=${!this.ready}></action-bar-picker>`;
  }
}
