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
import { style } from './env-switcher.css.js';
import { createTag, newTab } from '../../../utils/browser.js';
import { getTimeAgo } from '../../../utils/i18n.js';
import { ConnectedElement } from '../../connected-element/connected-element.js';

/**
 * @typedef {import('../../action-bar/picker/picker.js').Picker} Picker
 */

/**
 * Environment Switcher component
 * @element env-switcher
 * @class EnvironmentSwitcher
 */
@customElement('env-switcher')
export class EnvironmentSwitcher extends ConnectedElement {
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
      () => this.appStore.status,
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
      dev: this.appStore.i18n('development'),
      edit: this.appStore.i18n('edit'),
      preview: this.appStore.i18n('preview'),
      live: this.appStore.i18n('live'),
      prod: this.appStore.i18n('production'),
    };

    // Determine the current environment
    if (this.appStore.isEditor()) {
      this.currentEnv = 'edit';
    } else if (this.appStore.isDev()) {
      this.currentEnv = 'dev';
    } else if (this.appStore.isPreview()) {
      this.currentEnv = 'preview';
    } else if (this.appStore.isLive()) {
      this.currentEnv = 'live';
    } else if (this.appStore.isProd()) {
      this.currentEnv = 'prod';
    }

    this.picker.label = this.envNames[this.currentEnv];
    this.picker.classList.add(`env-${this.currentEnv}`);

    this.renderMenu();
  }

  /**
   * Returns the last modified label for the specified environment
   * @param {string} id - The id of the plugin
   * @param {string} lastModified - The last modified date
   * @returns {string} - The last modified label
   */
  getLastModifiedLabel(id, lastModified) {
    const envId = id === 'dev' ? 'preview' : id;
    return lastModified
      ? this.appStore.i18n(`${envId}_last_updated`).replace('$1', getTimeAgo(this.appStore.languageDict, lastModified))
      : this.appStore.i18n(`${envId}_never_updated`);
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
    if (this.currentEnv === id) {
      attrs.disabled = '';
    }
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
      text: this.getLastModifiedLabel(id, lastModified),
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
      text: this.appStore.i18n('navigate_to'),
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
    const { status } = this.appStore;

    // Reset contents of picker
    picker.innerHTML = '';

    // Pull mod dates from status
    const editLastMod = status.edit?.lastModified;
    const previewLastMod = status.preview?.lastModified;
    const liveLastMod = status.live?.lastModified;

    const navToHeader = this.createNavigateToHeader();
    const divider = this.createDivider();
    const devMenuItem = this.createMenuItem('dev', {}, previewLastMod);
    const editMenuItem = this.createMenuItem('edit', {}, editLastMod);
    const previewMenuItem = this.createMenuItem('preview', {}, previewLastMod);
    const liveMenuItem = this.createMenuItem('live', {}, liveLastMod);
    const prodMenuItem = this.createMenuItem('prod', {}, liveLastMod);

    // Check if edit is newer than preview, if so add update flag
    if (editLastMod && (!previewLastMod || new Date(editLastMod) > new Date(previewLastMod))) {
      previewMenuItem.setAttribute('update', 'true');
    }

    // Check if preview is newer than live, if so add update flag
    if (status.live?.status === 200
      && (!liveLastMod || (liveLastMod && new Date(liveLastMod) < new Date(previewLastMod)))) {
      liveMenuItem.setAttribute('update', 'true');
    }

    let showProd = false;
    if (this.appStore.siteStore.host
      && this.appStore.siteStore.host !== this.appStore.siteStore.outerHost
      && (this.appStore.isEditor() || this.appStore.isProject())
      && this.currentEnv !== 'prod') {
      showProd = true;
    }

    switch (this.currentEnv) {
      case 'dev':
        devMenuItem.classList.add('current-env');
        picker.append(
          devMenuItem,
          divider,
          navToHeader,
          editMenuItem,
          previewMenuItem,
          liveMenuItem,
        );
        break;
      case 'edit':
        editMenuItem.classList.add('current-env');
        picker.append(
          editMenuItem,
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

    if (this.currentEnv !== 'live' && (showProd || this.currentEnv === 'prod')) {
      // TODO: show/hide live based on alt/option key
      liveMenuItem.remove();
    }

    if (this.appStore.status?.webPath) {
      this.ready = true;
    }
  }

  /**
   * Handles the environment switcher change event
   */
  onChange() {
    const { picker } = this;
    const { value } = picker;

    const openNewTab = value === 'edit'
      ? true
      : newTab(this.appStore.keyboardListener);

    this.appStore.switchEnv(value, openNewTab);
    picker.value = this.currentEnv;
  }

  render() {
    return html`<action-bar-picker icons="none" @change=${this.onChange} .disabled=${!this.ready}></action-bar-picker>`;
  }
}
