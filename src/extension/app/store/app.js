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

/* eslint-disable no-restricted-globals, no-nested-ternary */

import { observable, action } from 'mobx';
import { createContext } from '@lit/context';
import { SiteStore } from './site.js';
import { BulkStore } from './bulk.js';
import { AdminClient } from '../utils/admin-client.js';
import sampleRUM from '../../utils/rum.js';
import { fetchLanguageDict, i18n } from '../utils/i18n.js';
import {
  getLocation, matchProjectHost, isSupportedFileExtension, globToRegExp,
  is401Page,
} from '../utils/browser.js';
import { EventBus } from '../utils/event-bus.js';
import {
  ENVS,
  EVENTS,
  EXTERNAL_EVENTS,
  RESTRICTED_PATHS,
  STATE,
} from '../constants.js';
// eslint-disable-next-line import/no-cycle
import { Plugin } from '../components/plugin/plugin.js';
import { createEnvPlugin } from '../plugins/env/env.js';
import { createEditPlugin } from '../plugins/edit/edit.js';
import { createPreviewPlugin } from '../plugins/preview/preview.js';
import { createReloadPlugin } from '../plugins/reload/reload.js';
import { createDeletePlugin } from '../plugins/delete/delete.js';
import { createPublishPlugin } from '../plugins/publish/publish.js';
import { createUnpublishPlugin } from '../plugins/unpublish/unpublish.js';
import { createBulkPreviewPlugin } from '../plugins/bulk/bulk-preview.js';
import { createBulkPublishPlugin } from '../plugins/bulk/bulk-publish.js';
import {
  createBulkCopyLiveUrlsPlugin,
  createBulkCopyPreviewUrlsPlugin,
  createBulkCopyProdUrlsPlugin,
  createBulkCopyUrlsPlugin,
} from '../plugins/bulk/bulk-copy-urls.js';
import { KeyboardListener } from '../utils/keyboard.js';
import { ModalContainer } from '../components/modal/modal-container.js';
import { getConfig, setConfig } from '../../config.js';

/**
 * The sidekick configuration object type
 * @typedef {import('@Types').SidekickOptionsConfig} SidekickOptionsConfig
 */

/**
 * The CustomPlugin object type
 * @typedef {import('@Types').CustomPlugin} CustomPlugin
 */

/**
 * The AEMSidekick object type
 * @typedef {import('../aem-sidekick.js').AEMSidekick} AEMSidekick
 */

/**
 * The core plugin object type
 * @typedef {import('@Types').CorePlugin} CorePlugin
 */

/**
 * @typedef {import('@Types').AdminResponse} AdminResponse
 */

/**
 * @typedef {import('@Types').AdminJob} AdminJob
 */

/**
 * @typedef {import('@Types').Modal} Modal
 */

/**
 * @typedef {import('@Types').Toast} Toast
 */

/**
 * Enum for view types.
 * @enum {number}
 */
export const VIEWS = {
  DEFAULT: 0,
  CUSTOM: 1,
};

export class AppStore {
  /**
   * The current location
   * @type {URL}
   */
  location;

  /**
   * The sidekick element
   * @type {AEMSidekick}
   */
  sidekick;

  /**
   * The site store
   * @type {SiteStore}
   */
  siteStore;

  /**
   * The bulk store (admin only)
   * @type {BulkStore}
   */
  bulkStore;

  /**
   * The Admin API client
   * @type AdminClient
   */
  api;

  /**
   * Status of the current document
   * @type {Object}
   */
  @observable accessor status = {};

  /**
   * Profile of the current user
   * @type {Object}
   */
  @observable accessor profile;

  /**
   * Dictionary of language keys
   * @type {Object}
   */
  languageDict;

  /**
   * Dictionary of language keys
   * @type {Object.<string, Plugin>}
   */
  @observable accessor corePlugins = {};

  /**
   * Dictionary of language keys
   * @type {Object.<string, Plugin>}
   */
  @observable accessor customPlugins = {};

  /**
   * Keyboards listener
   * @type {KeyboardListener}
   */
  keyboardListener;

  /**
   * The current state of the sidekick
   * @type {String}
   */
  @observable accessor state = STATE.INITIALIZING;

  /**
   * Toast data
   * @type {import('@Types').Toast}
   */
  accessor toast;

  /**
   * The current state of the sidekick
   * @type {'light'|'dark'}
   */
  @observable accessor theme;

  constructor() {
    this.siteStore = new SiteStore(this);
    this.bulkStore = new BulkStore(this);
    this.keyboardListener = new KeyboardListener();
    this.api = new AdminClient(this);
  }

  /**
   * Loads the sidekick configuration and language dictionary,
   * and retrieves the location of the current document.
   * @param {AEMSidekick} sidekick The sidekick HTMLElement
   * @param {SidekickOptionsConfig} inputConfig The sidekick config
   */
  async loadContext(sidekick, inputConfig) {
    this.theme = await getConfig('local', 'theme') || 'dark';
    this.sidekick = sidekick;
    this.location = getLocation();

    await this.siteStore.initStore(inputConfig);

    if (this.isAdmin()) {
      this.bulkStore.initStore(this.location);
    }

    // load dictionary based on user language
    this.languageDict = await fetchLanguageDict(this.siteStore);
    if (!this.languageDict.title) {
      // unsupported language, default to english
      this.languageDict = await fetchLanguageDict(this.siteStore, 'en');
    }

    this.setupPlugins();

    this.fetchStatus();

    this.showView();
  }

  /**
   * Set the application state
   * @param {string} [state] The state to set
   */
  @action
  setState(state) {
    if (state) {
      this.state = state;
      return;
    }

    const { profile } = this.status;
    const { authorized } = this.siteStore;
    const code = this.status?.code?.status === 200;
    const media = this.status?.webPath?.match(/\/media[_-]+\d+/)
      && this.status?.preview?.status === 404
      && this.status?.live?.status === 404
      && this.status?.code?.status === 404;

    if (!profile && !authorized) {
      this.state = STATE.LOGIN_REQUIRED;
    } else if (!authorized) {
      this.state = STATE.UNAUTHORIZED;
    } else if (media) {
      this.state = STATE.MEDIA;
    } else if (code) {
      this.state = STATE.CODE;
    } else {
      this.state = STATE.READY;
    }
  }

  /**
   * Adds a plugin to the registry. or as a child to a container plugin.
   * @private
   * @param {Object} registry The plugin registry
   * @param {*} plugin The plugin
   */
  registerPlugin(registry, plugin) {
    if (plugin.isChild() && registry[plugin.getContainerId()]) {
      registry[plugin.getContainerId()].append(plugin);
    } else {
      registry[plugin.id] = plugin;
    }
  }

  /**
   * Sets up the plugins in a single call
   */
  setupPlugins() {
    this.setupCorePlugins();
    this.setupCustomPlugins();
  }

  /**
   * Sets up the core plugins.
   */
  @action
  setupCorePlugins() {
    this.corePlugins = {};

    if (this.siteStore.ready && this.siteStore.authorized) {
      const envPlugin = createEnvPlugin(this);
      const editPlugin = createEditPlugin(this);
      const previewPlugin = createPreviewPlugin(this);
      const reloadPlugin = createReloadPlugin(this);
      const deletePlugin = createDeletePlugin(this);
      const publishPlugin = createPublishPlugin(this);
      const unpublishPlugin = createUnpublishPlugin(this);
      const bulkPreviewPlugin = createBulkPreviewPlugin(this);
      const bulkPublishPlugin = createBulkPublishPlugin(this);
      const bulkCopyUrlsPlugin = createBulkCopyUrlsPlugin(this);
      const bulkCopyPreviewUrlsPlugin = createBulkCopyPreviewUrlsPlugin(this);
      const bulkCopyLiveUrlsPlugin = createBulkCopyLiveUrlsPlugin(this);
      const bulkCopyProdUrlsPlugin = createBulkCopyProdUrlsPlugin(this);

      this.registerPlugin(this.corePlugins, envPlugin);
      this.registerPlugin(this.corePlugins, editPlugin);
      this.registerPlugin(this.corePlugins, previewPlugin);
      this.registerPlugin(this.corePlugins, reloadPlugin);
      this.registerPlugin(this.corePlugins, deletePlugin);
      this.registerPlugin(this.corePlugins, publishPlugin);
      this.registerPlugin(this.corePlugins, unpublishPlugin);
      this.registerPlugin(this.corePlugins, bulkPreviewPlugin);
      this.registerPlugin(this.corePlugins, bulkPublishPlugin);
      this.registerPlugin(this.corePlugins, bulkCopyUrlsPlugin);
      this.registerPlugin(this.corePlugins, bulkCopyPreviewUrlsPlugin);
      this.registerPlugin(this.corePlugins, bulkCopyLiveUrlsPlugin);
      this.registerPlugin(this.corePlugins, bulkCopyProdUrlsPlugin);
    }
  }

  /**
   * Sets up the core plugins.
   */
  @action
  setupCustomPlugins() {
    this.customPlugins = {};

    if (this.siteStore.authorized) {
      const {
        location,
        siteStore: {
          lang, plugins, innerHost,
        },
      } = this;
      if (plugins && Array.isArray(plugins)) {
        plugins.forEach((cfg, i) => {
          const {
            id = `custom-plugin-${i}`,
            title = id,
            titleI18n,
            url,
            pinned,
            passConfig,
            passReferrer,
            isPalette,
            event: eventName,
            environments,
            excludePaths,
            includePaths,
            isContainer,
            containerId,
            isBadge,
            badgeVariant,
            confirm,
          } = cfg;
          const condition = (appStore) => {
            let excluded = false;
            const pathSearchHash = appStore.location.href.replace(appStore.location.origin, '');
            if (excludePaths && Array.isArray(excludePaths)
              && excludePaths.some((glob) => globToRegExp(glob).test(pathSearchHash))) {
              excluded = true;
            }
            if (includePaths && Array.isArray(includePaths)
              && includePaths.some((glob) => globToRegExp(glob).test(pathSearchHash))) {
              excluded = false;
            }
            if (excluded) {
              // excluding plugin
              return false;
            }
            if (!environments || environments.includes('any')) {
              return true;
            }
            const envChecks = {
              dev: appStore.isDev,
              edit: appStore.isEditor,
              preview: appStore.isPreview,
              live: appStore.isLive,
              prod: appStore.isProd,
            };
            return environments.some((env) => envChecks[env] && envChecks[env].call(appStore));
          };
          // assemble plugin config
          const plugin = {
            custom: true,
            id,
            condition,
            button: {
              text: (titleI18n && titleI18n[lang]) || title,
              action: () => {
                if (url) {
                  const target = new URL(url, `https://${innerHost}/`);
                  if (passConfig) {
                    target.searchParams.append('ref', this.siteStore.ref);
                    target.searchParams.append('repo', this.siteStore.repo);
                    target.searchParams.append('owner', this.siteStore.owner);
                    if (this.siteStore.host) target.searchParams.append('host', this.siteStore.host);
                    if (this.siteStore.project) target.searchParams.append('project', this.siteStore.project);
                  }
                  if (passReferrer) {
                    target.searchParams.append('referrer', location.href);
                  }
                  if (isPalette) {
                    EventBus.instance.dispatchEvent(new CustomEvent(EVENTS.OPEN_PALETTE, {
                      detail: {
                        plugin: {
                          ...cfg,
                          url: target.toString(),
                        },
                      },
                    }));
                  } else {
                    // open url in new window
                    this.openPage(target.toString(), `aem-sk-${id}`);
                  }
                } else if (eventName) {
                  // fire custom event
                  this.fireEvent(`custom:${eventName}`);
                }
              },
              isDropdown: isContainer,
            },
            pinned,
            confirm,
            container: containerId,
            isBadge,
            badgeVariant,
          };

          // check if this overlaps with a core plugin, if so override the condition only
          const corePlugin = this.corePlugins[plugin.id];
          if (corePlugin) {
            // extend default condition
            const { condition: defaultCondition } = corePlugin.config;
            corePlugin.config.condition = (s) => defaultCondition(s) && condition(s);
            corePlugin.config.confirm = confirm;
          } else {
            // add custom plugin
            const customPlugin = new Plugin(plugin, this);
            this.registerPlugin(this.customPlugins, customPlugin);
          }
        });
      }
    }
  }

  /**
   * Checks if the current location is a development URL.
   * @returns {boolean} <code>true</code> if development URL, else <code>false</code>
   */
  isDev() {
    const { siteStore, location } = this;
    return [
      '', // for unit testing
      siteStore.devUrl.host, // for development and browser testing
    ].includes(location.host);
  }

  /**
   * Checks if the current location is an inner CDN URL.
   * @returns {boolean} <code>true</code> if inner CDN URL, else <code>false</code>
   */
  isPreview() {
    const { siteStore, location } = this;
    return matchProjectHost(siteStore.innerHost, location.host)
       || matchProjectHost(siteStore.stdInnerHost, location.host);
  }

  /**
   * Checks if the current location is an outer CDN URL.
   * @returns {boolean} <code>true</code> if outer CDN URL, else <code>false</code>
   */
  isLive() {
    const { siteStore, location } = this;
    return matchProjectHost(siteStore.outerHost, location.host)
        || matchProjectHost(siteStore.stdOuterHost, location.host);
  }

  /**
   * Checks if the current location is a production URL.
   * @returns {boolean} <code>true</code> if production URL, else <code>false</code>
   */
  isProd() {
    const { siteStore, location } = this;
    return siteStore.host === location.host;
  }

  /**
   * Checks if the current location is an admin URL (SharePoint or Google Drive).
   * @returns {boolean} <code>true</code> if admin URL, else <code>false</code>
   */
  isAdmin() {
    const { location } = this;
    return this.isSharePointFolder(location) || location.host === 'drive.google.com';
  }

  /**
   * Checks if the current location is a configured project URL.
   * @returns {boolean} <code>true</code> if project URL, else <code>false</code>
   */
  isProject() {
    const { siteStore } = this;
    return siteStore.owner && siteStore.repo
        && (this.isDev() || this.isPreview() || this.isLive() || this.isProd());
  }

  /**
   * Checks if the current location is an editor URL (SharePoint or Google Docs).
   * @returns {boolean} <code>true</code> if editor URL, else <code>false</code>
   */
  isEditor() {
    const { location } = this;
    const { host } = location;
    if (this.isSharePointEditor(location) || this.isSharePointViewer(location)) {
      return true;
    }
    if (host === 'docs.google.com') {
      return true;
    }

    return false;
  }

  /**
   * Checks if the user is logged in.
   * @returns {boolean} <code>true</code> if user is logged in (or does not need to be),
   * else <code>false</code>
   */
  isAuthenticated() {
    return !!this.status?.profile;
  }

  /**
   * Checks if the user is allowed to use a feature.
   * @param {string} feature The feature to check
   * @param {string} permission The permission to require
   * @returns {boolean} <code>true</code> if user is allowed, else <code>false</code>
   */
  isAuthorized(feature, permission) {
    if (!this.status[feature]) {
      // unknown feature
      return false;
    }
    if (!this.status[feature].permissions) {
      // feature doesn't require permissions
      return true;
    }
    return this.status[feature].permissions.includes(permission);
  }

  /**
   * Checks if the current location is a content URL.
   * @returns {boolean} <code>true</code> if content URL, else <code>false</code>
   */
  isContent() {
    const extSupported = isSupportedFileExtension(this.location.pathname);
    return this.isEditor() || this.isAdmin() || extSupported;
  }

  /**
   * Recognizes a SharePoint URL.
   * @private
   * @param {URL} url The URL
   * @returns {boolean} <code>true</code> if URL is SharePoint, else <code>false</code>
   */
  isSharePoint(url) {
    const { host } = url;
    const { mountpoint } = this.siteStore;
    return /\w+\.sharepoint.com$/.test(host)
        || (!host.endsWith('.google.com') && mountpoint && new URL(mountpoint).host === host);
  }

  /**
   * Recognizes a SharePoint document management URL.
   * @private
   * @param {URL} url The URL
   * @returns {boolean} <code>true</code> if URL is SharePoint DM, else <code>false</code>
   */
  isSharePointDM(url) {
    return this.isSharePoint(url)
      && (url.pathname.endsWith('/Forms/AllItems.aspx')
      || url.pathname.endsWith('/onedrive.aspx'));
  }

  /**
   * Recognizes a SharePoint folder URL.
   * @param {URL} url The URL
   * @returns {boolean} <code>true</code> if URL is SharePoint folder, else <code>false</code>
   */
  isSharePointFolder(url) {
    if (this.isSharePointDM(url)) {
      const sp = new URLSearchParams(url.search);
      const docPath = sp.get('id') || sp.get('RootFolder');
      const dotIndex = docPath?.split('/').pop().indexOf('.');
      return !docPath || [-1, 0].includes(dotIndex); // if doc path, dot can only be first char
    }
    return false;
  }

  /**
   * Recognizes a SharePoint editor URL.
   * @param {URL} url The URL
   * @returns {boolean} <code>true</code> if URL is SharePoint editor, else <code>false</code>
   */
  isSharePointEditor(url) {
    const { pathname, search } = url;
    return this.isSharePoint(url)
      && pathname.match(/\/_layouts\/15\/[\w]+.aspx/)
      && search.includes('sourcedoc=');
  }

  /**
   * Recognizes a SharePoint viewer URL.
   * @param {URL} url The URL
   * @returns {boolean} <code>true</code> if URL is SharePoint viewer, else <code>false</code>
   */
  isSharePointViewer(url) {
    if (this.isSharePointDM(url)) {
      const docPath = new URLSearchParams(url.search).get('id');
      const dotIndex = docPath?.split('/').pop().lastIndexOf('.');
      return dotIndex > 0; // must contain a dot
    }
    return false;
  }

  /**
   * Returns a label for the content source
   * @returns {string} The content source label
   */
  getContentSourceLabel() {
    const { contentSourceType, contentSourceEditLabel } = this.siteStore;

    if (contentSourceType === 'onedrive') {
      return 'SharePoint';
    } else if (contentSourceType === 'google') {
      return 'Google Drive';
    } else if (contentSourceEditLabel) {
      return contentSourceEditLabel;
    } else {
      return 'BYOM';
    }
  }

  /**
   * Creates a modal and appends it to the sidekick.
   * If a modal is already open, it will be replaced.
   * @param {Modal} modal The modal to display
   */
  showModal(modal) {
    const existingModal = this.sidekick?.shadowRoot?.querySelector('theme-wrapper').querySelector('modal-container');
    if (existingModal) {
      existingModal.remove();
    }

    const modalContainer = new ModalContainer(modal, this);
    this.sidekick?.shadowRoot?.querySelector('theme-wrapper').appendChild(modalContainer);

    return modalContainer;
  }

  showOnboarding() {
    const dialog = document.createElement('onboarding-dialog');
    this.sidekick?.shadowRoot?.querySelector('theme-wrapper').appendChild(dialog);
  }

  /**
   * Opens a new page. Abstracted for testing.
   * @param {string} url The URL to open
   * @param {string} [name] The window name (optional)
   * @returns {Window} The window object
   */
  // istanbul ignore next 3
  openPage(url, name) {
    return window.open(url, name);
  }

  /**
   * Navigates to the provided URL in the current window. Abstracted for testing.
   * @param {string} url The URL to load
   */
  // istanbul ignore next 7
  loadPage(url) {
    if (url === window.location.href) {
      window.location.reload();
    } else {
      window.location.href = url;
    }
  }

  /**
   * Reloads the current page. Abstracted for testing.
   * @param {boolean} [newTab] Open current page in a new tab
   */
  reloadPage(newTab) {
    if (newTab) {
      this.openPage(window.location.href);
    } else {
      this.loadPage(window.location.href);
    }
  }

  /**
   * Fires an event with the given name.
   * @param {string} name The name of the event
   * @param {Object} data The data to pass to event listeners (optional)
   */
  fireEvent(name, data) {
    try {
      const {
        sidekick, siteStore, location, status,
      } = this;
      data = data || {
        // turn complex into simple objects for event listener
        config: siteStore.toJSON(),
        location: {
          hash: location.hash,
          host: location.host,
          hostname: location.hostname,
          href: location.href,
          origin: location.origin,
          pathname: location.pathname,
          port: location.port,
          protocol: location.protocol,
          search: location.search,
        },
        status,
      };
      sidekick.dispatchEvent(new CustomEvent(name, {
        detail: data,
      }));
      const userEvents = [
        'updated',
        'previewed',
        'published',
        'unpublished',
        'deleted',
        'logged-in',
        'logged-out',
        'hidden',
      ];
      if (name.startsWith('custom:') || userEvents.includes(name)) {
        /* istanbul ignore next */
        this.sampleRUM('click', {
          source: 'sidekick',
          target: name,
        });
      }
    } catch (e) {
      /* istanbul ignore next 2 */
      // eslint-disable-next-line no-console
      console.warn('failed to fire event', name, e);
    }
  }

  /**
   * Displays a toast message
   * @param {Toast} toast The toast to display
   */
  showToast({
    message,
    variant = 'info',
    closeCallback,
    actionCallback,
    actionLabel = this.i18n('ok'),
    secondaryCallback,
    secondaryLabel,
    timeout = 3000,
    timeoutCallback,
  }) {
    if (this.toast) {
      this.toast = null;
      this.setState();
    }

    this.toast = {
      message,
      variant,
      closeCallback,
      actionCallback,
      actionLabel,
      secondaryCallback,
      secondaryLabel,
      timeout,
      timeoutCallback,
    };

    this.setState(STATE.TOAST);

    if (this.toast.timeout > 0) {
      setTimeout(() => {
        this.closeToast();
        if (typeof timeoutCallback === 'function') {
          timeoutCallback();
        }
      }, this.toast.timeout);
    }
  }

  /**
   * Samples RUM event, abstracted for testing.
   * @param {string} event The event name
   * @param {Object} data The event data
   */
  sampleRUM(event, data) {
    sampleRUM(event, data);
  }

  /**
   * Closes the toast message
   */
  closeToast() {
    const { closeCallback } = this.toast || {};
    if (typeof closeCallback === 'function') {
      closeCallback();
    }

    this.toast = null;
    this.setState();
  }

  /**
   * Checks for configured views for the current resource.
   * @private
   * @param {number} viewType An optional view type (see {@link VIEWS})
   * @param {string} [testPath] An optional test path (default: status.webPath)
   * @returns {Object[]} The views
   */
  findViews(viewType, testPath) {
    // find view based on resource path
    if (!testPath) {
      if (this.isProject()) {
        const { pathname } = this.location;
        testPath = pathname;
      } else {
        const { webPath } = this.status;
        if (!webPath) {
          return [];
        }
        testPath = webPath;
      }
    }

    const scriptRoot = chrome.runtime.getURL('/');
    const { views } = this.siteStore;
    const defaultOnly = viewType === VIEWS.DEFAULT;
    const customOnly = viewType === VIEWS.CUSTOM;
    return views.filter(({
      path,
      viewer,
    }) => globToRegExp(path).test(testPath)
        && !RESTRICTED_PATHS.includes(testPath)
        && (!defaultOnly || viewer.startsWith(scriptRoot))
        && (!customOnly || !viewer.startsWith(scriptRoot)));
  }

  /**
     * Fetches the status for the current resource.
     * @fires Sidekick#status-fetched
     * @param {boolean} [refreshLocation] Refresh the sidekick's location (optional)
     * @param {boolean} [fetchEdit] Should the edit url be fetched (optional)
     * @param {boolean} [transient] Should we persist the status in the store (optional)
     * @returns {Promise<Object> | undefined} The status object
     */
  async fetchStatus(refreshLocation, fetchEdit = false, transient = false) {
    let status;

    if (refreshLocation) {
      this.location = getLocation();
    }

    const { owner, repo, ref } = this.siteStore;
    if (!owner || !repo || !ref) {
      return status;
    }

    this.setState(STATE.FETCHING_STATUS);
    const isDM = this.isEditor() || this.isAdmin();
    const editUrl = isDM ? this.location.href : (fetchEdit ? 'auto' : '');
    const path = isDM ? '' : this.location.pathname;

    status = await this.api.getStatus(path, editUrl);

    // Do we want to update the store with the new status?
    if (status && !transient) {
      this.updateStatus(status);
      this.fireEvent(EXTERNAL_EVENTS.STATUS_FETCHED, status);

      // Don't set a state if a toast is shown
      // istanbul ignore else
      if (!this.toast) {
        this.setState();
      }
    }

    return status;
  }

  /**
   * Helper i18n function
   * @param {string} key Dictionary key
   * @returns {string} The translated string
   */
  i18n(key) {
    return i18n(this.languageDict, key);
  }

  /**
   * Updates the observable status of the current resource.
   * @param {Object} status The status object
   */
  @action
  updateStatus(status) {
    this.status = status;
  }

  /**
   * Updates the preview or code of the current resource.
   * @fires Sidekick#previewed
   * @param {string} [path] The path to update (defaults to <code>status.webPath</code>)
   * @returns {Promise<boolean>} True if the preview was updated successfully, false otherwise
   */
  async update(path) {
    const { siteStore, status } = this;
    path = path || status.webPath;

    this.setState(STATE.PREVIEWING);

    // update preview
    const previewStatus = await this.api.updatePreview(path);
    if (previewStatus) {
      // If we are on preview, we need to bust the cache on the page to ensure the latest
      // content is loaded.
      if (this.isPreview()) {
        const host = this.isDev() ? siteStore.devUrl.host : `https://${siteStore.innerHost}`;
        await fetch(`${host}${path}`, { cache: 'reload', mode: 'no-cors' });
      }
    }

    return !!previewStatus;
  }

  async updatePreview(ranBefore) {
    this.setState(STATE.PREVIEWING);

    const res = await this.update();
    if (!res && !ranBefore) {
      // assume document has been renamed, re-fetch status and try again
      this.sidekick.addEventListener(EXTERNAL_EVENTS.STATUS_FETCHED, async () => {
        this.updatePreview(true);
      }, { once: true });
      this.fetchStatus();
      return;
    }

    if (res) {
      // special handling of config files
      if (this.status.webPath.startsWith('/.helix/')) {
        this.showToast({
          message: this.i18n('config_success'),
          variant: 'positive',
        });
      } else {
        this.showToast({
          message: this.i18n('preview_success'),
          variant: 'positive',
        });
        this.switchEnv('preview', false, true);
      }
    }
  }

  /**
   * Deletes the current resource from preview and unpublishes it if published.
   * @fires Sidekick#deleted
   * @returns {Promise<boolean>} True if the resource was deleted successfully, false otherwise
   */
  async delete() {
    const { status } = this;
    const path = status.webPath;

    // delete content only
    if (!this.isContent()) {
      return false;
    }

    this.setState(STATE.DELETING);

    // delete preview
    const resp = await this.api.updatePreview(path, true);

    // also unpublish if published
    if (resp && status.live && status.live.lastModified) {
      await this.unpublish();
    }

    return !!resp;
  }

  /**
   * Publishes the page at the specified path if <code>config.host</code> is defined.
   * @fires Sidekick#published
   * @param {string} [path] The path to update (defaults to <code>status.webPath</code>)
   * @returns {Promise<boolean>} True if the page was published successfully, false otherwise
   */
  async publish(path) {
    const { status } = this;
    path = path || status.webPath;

    // publish content only
    if (!this.isContent()) {
      return false;
    }

    this.setState(STATE.PUBLISHNG);

    // update live
    const resp = await this.api.updateLive(path);

    return !!resp;
  }

  /**
   * Unpublishes the current page.
   * @fires Sidekick#unpublished
   * @returns {Promise<boolean>} True if the page was unpublished successfully, false otherwise
   */
  async unpublish() {
    // unpublish content only
    if (!this.isContent()) {
      return false;
    }

    this.setState(STATE.UNPUBLISHING);

    const { status } = this;
    const path = status.webPath;

    // delete live
    const resp = await this.api.updateLive(path, true);
    return !!resp;
  }

  /**
   * Creates and/or returns a view overlay.
   * @param {boolean} [create] Create the view if none exists
   * @returns {Element} The view overlay
   */
  getViewOverlay(create) {
    let view = this.sidekick.shadowRoot.querySelector('.aem-sk-special-view');

    if (create && !view) {
      view = document.createElement('div');
      view.classList.add('aem-sk-special-view');
      this.sidekick.shadowRoot.append(view);

      const iframe = document.createElement('iframe');
      iframe.setAttribute('class', 'container');
      iframe.setAttribute('allow', 'clipboard-write *');
      view.appendChild(iframe);

      // listen for messages from the view
      window.addEventListener('message', (event) => {
        // only accept messages from the extension
        if (event.origin === `chrome-extension://${chrome.runtime.id}`) {
          const { data } = event;
          if (data.detail.event === 'hlx-close-view') {
            view.remove();
            [...this.sidekick.parentElement.children].forEach((el) => {
              if (el !== this.sidekick) {
                try {
                  // @ts-ignore
                  el.style.display = 'initial';
                } catch (e) {
                  // ignore
                }
              }
            });
          }
        }
      });
    }
    return view;
  }

  /**
   * Shows the view.
   * @private
   */
  async showView() {
    if (!this.isProject()) {
      return;
    }
    const {
      location: {
        origin,
        href,
        search,
      },
    } = this;
    const searchParams = new URLSearchParams(search);
    if (searchParams.get('path')) {
      // custom view
      return;
    }
    const [view] = this.findViews(VIEWS.DEFAULT);
    if (view && !this.getViewOverlay()) {
      const { viewer, title } = view;
      if (viewer) {
        const viewUrl = new URL(viewer, origin);
        viewUrl.searchParams.set('url', href);
        viewUrl.searchParams.set('title', title(this.sidekick));
        const viewOverlay = this.getViewOverlay(true);
        viewOverlay.querySelector('.container').setAttribute('src', viewUrl.toString());
        // hide original content
        [...this.sidekick.parentElement.children].forEach((el) => {
          if (el !== this.sidekick) {
            try {
              // @ts-ignore
              el.style.display = 'none';
            } catch (e) {
              // ignore
            }
          }
        });
      }
    }
  }

  getBYOMSourceUrl() {
    const {
      owner,
      repo,
      contentSourceUrl,
      contentSourceEditPattern,
    } = this.siteStore;
    if (!contentSourceEditPattern || typeof contentSourceEditPattern !== 'string') return undefined;

    let { pathname } = this.location;
    if (pathname.endsWith('/')) pathname += 'index';

    const url = contentSourceEditPattern
      .replace('{{contentSourceUrl}}', contentSourceUrl)
      .replace('{{org}}', owner)
      .replace('{{site}}', repo)
      .replace('{{pathname}}', pathname);

    return url;
  }

  /**
   * Switches to (or opens) a given environment.
   * @param {string} targetEnv One of the following environments:
   *        edit, dev, preview, live or prod
   * @param {boolean} [open] true if environment should be opened in new tab
   * @fires Sidekick#envswitched
   */
  async switchEnv(targetEnv, open = false, cacheBust = false) {
    const hostType = ENVS[targetEnv];
    if (!hostType) {
      // eslint-disable-next-line no-console
      console.error('invalid environment', targetEnv);
      return;
    }
    if (this.status.error) {
      return;
    }
    const { siteStore, location: { href, search, hash }, status } = this;
    let envHost = siteStore[hostType];
    if (targetEnv === 'prod' && !envHost) {
      // no production host defined yet, use live instead
      envHost = siteStore.outerHost;
    }
    if (!status.webPath) {
      // eslint-disable-next-line no-console
      console.log('not ready yet, trying again in a second ...');
      window.setTimeout(
        // istanbul ignore next
        () => this.switchEnv(targetEnv, open), 1000,
      );
      return;
    }
    const envOrigin = targetEnv === 'dev' ? siteStore.devUrl.origin : `https://${envHost}`;
    let envUrl = `${envOrigin}${status.webPath}`;
    if (!this.isEditor()) {
      envUrl += `${search}${hash}`;
    }

    if (targetEnv === 'edit') {
      const updatedStatus = await this.fetchStatus(false, true);
      envUrl = updatedStatus.edit?.url || this.getBYOMSourceUrl();
      if (!envUrl) {
        this.showToast({
          message: this.i18n('edit_no_source'),
          variant: 'warning',
        });
        return;
      }
    }

    const [customView] = this.findViews(VIEWS.CUSTOM);
    if (customView) {
      const customViewUrl = new URL(customView.viewer, envUrl);
      customViewUrl.searchParams.set('path', status.webPath);
      envUrl = customViewUrl.href;
    }

    // Check if cache busting should be applied based on the environment and conditions.
    // The logic prevents cache busting if:
    // The target environment is 'prod' && the envUrl does not include any of the live
    // domains & the sidekick is running in transient mode.
    const liveDomains = ['aem.live', 'hlx.live'];
    if (cacheBust
      && !(targetEnv === 'prod' && !liveDomains.some((domain) => envUrl.includes(domain)) && this.siteStore.transient)) {
      const separator = envUrl.includes('?') ? '&' : '?';
      envUrl = `${envUrl}${separator}nocache=${Date.now()}`;
    }

    // switch or open env
    if (open || this.isEditor()) {
      this.openPage(envUrl, open
        ? '' : `aem-sk-env--${siteStore.owner}/${siteStore.repo}/${siteStore.ref}${status.webPath}`);
    } else {
      this.loadPage(envUrl);
    }
    this.fireEvent(EXTERNAL_EVENTS.EVIRONMENT_SWITCHED, {
      sourceUrl: href,
      targetUrl: envUrl,
    });
  }

  /**
   * Retrieves the profile of the current user.
   * @returns {Promise<Object | false>} The response object
   */
  async getProfile() {
    const response = await this.api.getProfile();
    if (!response) {
      return false;
    }

    if (response.status === 200) {
      return response.profile;
    }
    return false;
  }

  /**
   * Logs the user in.
   * @param {boolean} selectAccount <code>true</code> to allow user to select account (optional)
   */
  login(selectAccount) {
    this.setState(STATE.LOGGING_IN);
    const loginUrl = this.api.createUrl('login');
    loginUrl.searchParams.set('extensionId', window.chrome?.runtime?.id);
    if (selectAccount) {
      loginUrl.searchParams.set('selectAccount', 'true');
    }
    const loginWindow = this.openPage(loginUrl.toString());

    let attempts = 0;

    async function checkLoggedIn() {
      // istanbul ignore else
      if (loginWindow.closed) {
        const { siteStore, status } = this;
        attempts += 1;
        // try 5 times after login window has been closed
        this.status.profile = await this.getProfile();
        if (this.status.profile) {
          // logged in, stop checking
          delete status.status;
          this.sidekick.addEventListener(
            EXTERNAL_EVENTS.STATUS_FETCHED,
            () => this.setState(),
            { once: true },
          );
          await this.siteStore.initStore(siteStore);
          this.setupPlugins();
          this.fireEvent(EXTERNAL_EVENTS.LOGGED_IN, this.status.profile);
          // refresh page with site token in case of 401
          if (is401Page(this.location, window.document)) {
            this.reloadPage();
          } else {
            this.fetchStatus();
          }
          return;
        }
        if (attempts >= 5) {
          // give up after 5 attempts
          this.showToast({
            message: this.i18n('error_login_timeout'),
            variant: 'negative',
          });
          return;
        }
      }
      // try again after 1s
      window.setTimeout(checkLoggedIn.bind(this), 1000);
    }
    window.setTimeout(checkLoggedIn.bind(this), 1000);
  }

  /**
   * Logs the user out.
   */
  logout() {
    this.setState(STATE.LOGGING_OUT);
    const logoutUrl = this.api.createUrl('logout');
    logoutUrl.searchParams.set('extensionId', window.chrome?.runtime?.id);
    const logoutWindow = this.openPage(logoutUrl.toString());

    let attempts = 0;

    async function checkLoggedOut() {
      // istanbul ignore else
      if (logoutWindow.closed) {
        const { siteStore } = this;
        attempts += 1;
        // try 5 times after login window has been closed
        this.status.profile = await this.getProfile();
        if (!this.status.profile) {
          delete this.status.profile;
          await this.siteStore.initStore(siteStore);
          this.setupPlugins();
          this.fetchStatus();
          this.fireEvent(EXTERNAL_EVENTS.LOGGED_OUT, this.status.profile);
          return;
        }
        if (attempts >= 5) {
          this.showToast({
            message: this.i18n('error_logout'),
            variant: 'negative',
          });
          return;
        }
      }
      // try again after 1s
      window.setTimeout(checkLoggedOut.bind(this), 1000);
    }
    window.setTimeout(checkLoggedOut.bind(this), 1000);
  }

  /**
   * Validate the current session, and if the token is expired, re-login.
   * @returns {Promise<void>}
   */
  async validateSession() {
    return new Promise((resolve) => {
      const { profile } = this.status;
      if (!profile) {
        resolve();
      }
      const now = Date.now();
      const { exp } = profile;
      if (now > exp * 1000) {
        // token is expired
        this.login(true);
        this.sidekick.addEventListener(EXTERNAL_EVENTS.STATUS_FETCHED, () => {
          resolve();
        }, { once: true });
      } else {
        resolve();
      }
    });
  }

  async toggleTheme() {
    this.theme = this.theme === 'light' ? 'dark' : 'light';
    setConfig('local', { theme: this.theme });
  }
}

export const appStoreContext = createContext('appStore');
