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
import { ICONS } from '../../../constants.js';

/**
 * @typedef {import('../../action-bar/picker/picker.js').Picker} Picker
 */

/**
 * @typedef {import('../../plugin/plugin.js').Plugin} Plugin
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
      edit: this.appStore.i18n('source'),
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
   * @param {string} [lastModified] - The last mod date of the env. If undefined, item is disabled.
   * @returns {HTMLElement} - The created menu item
   */
  createMenuItem(id, attrs, lastModified) {
    if (this.currentEnv === id) {
      attrs.disabled = '';
    }

    const contentSourceLabel = this.appStore.getContentSourceLabel();
    if (id === 'edit' && contentSourceLabel === 'BYOM') {
      return createTag({
        tag: 'span',
      });
    }

    const label = this.envNames[id];
    const menuItem = createTag({
      tag: 'sk-menu-item',
      text: label,
      attrs: {
        value: id,
        class: `env-${id}`,
        ...attrs,
      },
    });

    if (id !== 'edit') {
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
    } else {
      const docIcon = createTag({
        tag: 'sp-icon',
        attrs: {
          slot: 'icon',
        },
      });

      const descriptionText = this.currentEnv === 'edit'
        ? this.getLastModifiedLabel(id, lastModified)
        : this.appStore.i18n('open_in').replace('$1', contentSourceLabel);

      const description = createTag({
        tag: 'span',
        text: descriptionText,
        attrs: {
          slot: 'description',
        },
      });

      menuItem.appendChild(description);

      const { status } = this.appStore;

      // eslint-disable-next-line no-nested-ternary
      docIcon.innerHTML = status.resourcePath?.endsWith('.json')
        ? ICONS.SHEET_ICON.strings.join('')
        : status.resourcePath.endsWith('.pdf')
          ? ICONS.PDF_ICON.strings.join('')
          : ICONS.DOC_ICON.strings.join('');

      menuItem.appendChild(docIcon);
    }

    return menuItem;
  }

  /**
   * Creates a "Environments" header
   * @param {string} key - The key to translate
   * @returns {HTMLElement} The created header
   */
  createHeader(key) {
    const menuItem = createTag({
      tag: 'div',
      text: this.appStore.i18n(key),
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
    const { status } = this.appStore;

    // Reset contents of picker
    picker.innerHTML = '';

    // Pull mod dates from status
    const editLastMod = status.edit?.lastModified;
    const previewLastMod = status.preview?.lastModified;
    const liveLastMod = status.live?.lastModified;

    const environmentsHeader = this.createHeader('environments');
    const devMenuItem = this.createMenuItem('dev', {}, previewLastMod);
    const editMenuItem = this.createMenuItem('edit', {}, editLastMod);
    const previewMenuItem = this.createMenuItem('preview', {}, previewLastMod);
    const liveMenuItem = this.createMenuItem('live', {}, liveLastMod);
    const prodMenuItem = this.createMenuItem('prod', {}, liveLastMod);

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
          environmentsHeader,
          editMenuItem,
          devMenuItem,
          previewMenuItem,
          liveMenuItem,
        );
        break;
      case 'edit':
        editMenuItem.classList.add('current-env');
        picker.append(
          environmentsHeader,
          editMenuItem,
          previewMenuItem,
          liveMenuItem,
        );
        break;
      case 'preview':
        previewMenuItem.classList.add('current-env');
        picker.append(
          environmentsHeader,
          editMenuItem,
          previewMenuItem,
          liveMenuItem,
        );
        break;
      case 'live':
        liveMenuItem.classList.add('current-env');
        picker.append(
          environmentsHeader,
          editMenuItem,
          previewMenuItem,
          liveMenuItem,
        );
        break;
      case 'prod':
        prodMenuItem.classList.add('current-env');
        picker.append(
          environmentsHeader,
          editMenuItem,
          previewMenuItem,
          liveMenuItem,
          prodMenuItem,
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

    if (this.appStore.status?.webPath && !this.appStore.status?.webPath.startsWith('/.helix')) {
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

    this.appStore.sampleRUM('click', {
      source: 'sidekick',
      target: `env-switched:${value}`,
    });
  }

  keydown(event) {
    if (event.key === 'Tab') {
      this.picker.close();
    }
  }

  render() {
    return html`<action-bar-picker class="env-switcher" icons="none" @change=${this.onChange} .disabled=${!this.ready} @keydown=${this.keydown}></action-bar-picker>`;
  }
}
