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
import { style } from './env-switcher.css.js';
import { appStore } from '../../../store/app.js';
import { createTag, newTab } from '../../../utils/browser.js';
import { i18n, getTimeAgo } from '../../../utils/i18n.js';

/**
 * @typedef {import('../../action-bar/picker/picker.js').Picker} Picker
 */

/**
 * Environment Switcher component
 * @element env-switcher
 * @class EnvironmentSwitcher
 */
@customElement('env-switcher')
export class EnvironmentSwitcher extends MobxLitElement {
  /**
   * The toast container HTMLElement
   * @type {Picker}
   */
  @query('action-bar-picker')
  accessor picker;

  /**
   * The current environment
   */
  @property({ type: String })
  accessor currentEnv;

  /**
   * Locale aware environment names
   */
  @property({ type: Object })
  accessor envNames;

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
    // Set up the locale aware environment names
    this.envNames = {
      edit: i18n(appStore.languageDict, 'edit'),
      preview: i18n(appStore.languageDict, 'preview'),
      live: i18n(appStore.languageDict, 'live'),
      prod: i18n(appStore.languageDict, 'production'),
    };

    // Determine the current environment
    if (appStore.isEditor()) {
      this.currentEnv = 'edit';
    } else if (appStore.isPreview()) {
      this.currentEnv = 'preview';
    } else if (appStore.isLive()) {
      this.currentEnv = 'live';
    } else if (appStore.isProd()) {
      this.currentEnv = 'prod';
    }

    this.picker.label = this.envNames[this.currentEnv];
    this.picker.classList.add(`env-${this.currentEnv}`);

    this.renderMenu();
  }

  /**
   * Creates a menu item with specified attributes and a description.
   *
   * @param {string} id - The id of the plugin
   * @param {Object} attrs - Additional HTML attributes to be applied to the menu item
   * @param {string} lastModified - The last mod date of the env. If undefined, item is disabled.
   * @returns {HTMLElement} - The created menu item
   */
  createMenuItem(id, attrs, lastModified) {
    const label = this.envNames[id];
    const menuItem = createTag({
      tag: 'sp-menu-item',
      text: label,
      attrs: {
        value: id,
        class: `env-${id}`,
        ...attrs,
      },
    });

    // Disable menu item if lastModified is undefined
    if (!lastModified) {
      menuItem.setAttribute('disabled', '');
    }

    const description = createTag({
      tag: 'span',
      text: lastModified
        ? i18n(appStore.languageDict, `${id}_last_updated`).replace('$1', getTimeAgo(appStore.languageDict, lastModified))
        : i18n(appStore.languageDict, `${id}_never_updated`),
      attrs: {
        slot: 'description',
      },
    });

    menuItem.appendChild(description);

    return menuItem;
  }

  /**
   * Creates a "Navigate to" header
   * @returns {HTMLElement} The created header
   */
  createNavigateToHeader() {
    const menuItem = createTag({
      tag: 'div',
      text: i18n(appStore.languageDict, 'navigate_to'),
      attrs: {
        class: 'heading',
      },
    });

    return menuItem;
  }

  /**
   * Creates a menu divider
   * @returns {HTMLElement} The created divider
   */
  createDivider() {
    return createTag({ tag: 'sp-menu-divider' });
  }

  /**
   * Renders the environment switcher menu
   */
  renderMenu() {
    const { picker } = this;
    const { status } = appStore;

    // Reset contents of picker
    picker.innerHTML = '';

    // Pull mod dates from status
    const editLastMod = status.edit?.lastModified;
    const previewLastMod = status.preview?.lastModified;
    const liveLastMod = status.live?.lastModified;

    const navToHeader = this.createNavigateToHeader();
    const divider = this.createDivider();
    const editMenuItem = this.createMenuItem('edit', {}, editLastMod);
    const previewMenuItem = this.createMenuItem('preview', {}, previewLastMod);
    const liveMenuItem = this.createMenuItem('live', {}, liveLastMod);
    const prodMenuItem = this.createMenuItem('prod', {}, liveLastMod);

    // Check if edit is newer than preview, if so add update flag
    if (editLastMod && (!previewLastMod || new Date(editLastMod) > new Date(previewLastMod))) {
      previewMenuItem.setAttribute('update', 'true');
    }

    // Check if preview is newer than live, if so add update flag
    if ((!liveLastMod
      || (liveLastMod && new Date(liveLastMod) < new Date(previewLastMod)))) {
      liveMenuItem.setAttribute('update', 'true');
    }

    let showProd = false;
    if (appStore.siteStore.host
      && appStore.siteStore.host !== appStore.siteStore.outerHost
      && (appStore.isEditor() || appStore.isProject())
      && this.currentEnv !== 'prod') {
      showProd = true;
    }

    switch (this.currentEnv) {
      case 'edit':
        picker.append(
          navToHeader,
          previewMenuItem,
          liveMenuItem,
        );
        break;
      case 'preview':
        previewMenuItem.classList.add('current-env');
        picker.append(
          previewMenuItem,
          divider,
          navToHeader,
          editMenuItem,
          liveMenuItem,
        );
        break;
      case 'live':
        liveMenuItem.classList.add('current-env');
        picker.append(
          liveMenuItem,
          divider,
          navToHeader,
          editMenuItem,
          previewMenuItem,
        );
        break;
      case 'prod':
        prodMenuItem.classList.add('current-env');
        picker.append(
          prodMenuItem,
          divider,
          navToHeader,
          editMenuItem,
          previewMenuItem,
          liveMenuItem,
        );
        break;
      default:
        break;
    }

    if (showProd) {
      picker.append(prodMenuItem);
    }

    if (appStore.status?.webPath) {
      this.ready = true;
    }
  }

  /**
   * Handles the environment switcher change event
   * @param {Event} event - The change event
   */
  onChange(event) {
    const { picker } = this;
    const { value } = picker;

    // TODO: Figure out how to get keyboard state
    // @ts-ignore
    appStore.switchEnv(value, newTab(event));
    picker.value = this.currentEnv;
  }

  render() {
    return html`<action-bar-picker icons="none" @change=${this.onChange} .disabled=${!this.ready}></action-bar-picker>`;
  }
}
