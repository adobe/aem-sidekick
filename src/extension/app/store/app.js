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

/* eslint-disable no-restricted-globals */

import { observable, action } from 'mobx';
import { SiteStore } from './site.js';
import { getAdminUrl, getAdminFetchOptions } from '../utils/helix-admin.js';
import sampleRUM from '../utils/rum.js';
import { fetchLanguageDict, i18n } from '../utils/i18n.js';
import {
  getLocation, matchProjectHost, isSupportedFileExtension, globToRegExp,
} from '../utils/browser.js';
import { EventBus } from '../utils/event-bus.js';
import {
  ENVS, EVENTS, EXTERNAL_EVENTS, MODALS, MODAL_EVENTS,
} from '../constants.js';
import { pluginFactory } from '../plugins/plugin-factory.js';
import { SidekickPlugin } from '../components/plugin/plugin.js';
import { KeyboardListener } from '../utils/keyboard.js';
import { ModalContainer } from '../components/modal/modal-container.js';
import { ToastContainer } from '../components/toast/toast-container.js';

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
 * @typedef {import('@Types').Modal} Modal
 */

export class AppStore {
  // eslint-disable-next-line no-undef
  @observable accessor initialized = false;

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
   * @type {Object.<string, SidekickPlugin>}
   */
  @observable accessor corePlugins;

  /**
   * Dictionary of language keys
   * @type {Object.<string, SidekickPlugin>}
   */
  @observable accessor customPlugins;

  /**
   * Keyboards listener
   * @type {KeyboardListener}
   */
  keyboardListener;

  constructor() {
    this.siteStore = new SiteStore(this);
    this.keyboardListener = new KeyboardListener();
  }

  /**
   * Loads the sidekick configuration and language dictionary,
   * and retrieves the location of the current document.
   * @param {AEMSidekick} sidekick The sidekick HTMLElement
   * @param {SidekickOptionsConfig} inputConfig The sidekick config
   * @fires Sidekick#contextloaded
   */
  async loadContext(sidekick, inputConfig) {
    this.sidekick = sidekick;
    this.location = getLocation();

    await this.siteStore.initStore(inputConfig);

    // load dictionary based on user language
    this.languageDict = await fetchLanguageDict(this.siteStore);
    if (!this.languageDict.title) {
      // unsupported language, default to english
      this.languageDict = await fetchLanguageDict(this.siteStore, 'en');
    }

    this.setupPlugins();

    this.fetchStatus();

    this.setInitialized();

    this.fireEvent(EXTERNAL_EVENTS.CONTEXT_LOADED, {
      config: this.siteStore.toJSON(),
      location: this.location,
    });
  }

  /**
   * Sets the initialized flag.
   */
  @action
  setInitialized() {
    this.initialized = true;
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
      const envPlugin = pluginFactory.createEnvPlugin(this);
      const previewPlugin = pluginFactory.createPreviewPlugin(this);
      const reloadPlugin = pluginFactory.createReloadPlugin(this);
      const deletePlugin = pluginFactory.createDeletePlugin(this);
      const publishPlugin = pluginFactory.createPublishPlugin(this);

      this.corePlugins[envPlugin.id] = envPlugin;
      this.corePlugins[previewPlugin.id] = previewPlugin;
      this.corePlugins[reloadPlugin.id] = reloadPlugin;
      this.corePlugins[deletePlugin.id] = deletePlugin;
      this.corePlugins[publishPlugin.id] = publishPlugin;
    }
  }

  /**
   * Sets up the core plugins.
   */
  @action
  setupCustomPlugins() {
    this.customPlugins = {};

    if (this.siteStore.authorized) {
      const { location, siteStore: { lang, plugins, innerHost } = {} } = this;
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
                  const target = url.startsWith('/') ? new URL(url, `https://${innerHost}/`) : new URL(url);
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
                        plugin: cfg,
                      },
                    }));
                  } else {
                    // open url in new window
                    this.openPage(target.toString(), `hlx-sk-${id || `custom-plugin-${i}`}`);
                  }
                } else if (eventName) {
                  // fire custom event
                  this.fireEvent(`custom:${eventName}`);
                }
              },
              isDropdown: isContainer,
            },
            pinned,
            container: containerId,
            appStore: this,
          };
          // check if this overlaps with a core plugin, if so override the condition only
          const corePlugin = this.corePlugins[plugin.id];
          if (corePlugin) {
            // extend default condition
            const { condition: defaultCondition } = corePlugin.config;
            corePlugin.config.condition = (s) => defaultCondition(s) && condition(s);
          } else {
            // add custom plugin
            const customPlugin = new SidekickPlugin(plugin);
            if (plugin.container) {
              this.customPlugins[plugin.container]?.append(customPlugin);
            } else {
              this.customPlugins[plugin.id] = customPlugin;
            }
          }
        });
      }
    }
  }

  /**
   * Returns the sidekick plugin with the specified ID.
   * @param {string} id The plugin ID
   * @returns {HTMLElement} The plugin
   */
  get(id) {
    return this.sidekick.renderRoot.querySelector(`:scope div.plugin.${id}`);
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
   * @private
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
   * @private
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
   * @private
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
   * Creates a modal and appends it to the sidekick.
   * If a modal is already open, it will be replaced.
   * @param {Modal} modal The modal to display
   */
  showModal(modal) {
    const existingModal = this.sidekick?.shadowRoot?.querySelector('theme-wrapper').querySelector('modal-container');
    if (existingModal) {
      existingModal.remove();
    }

    const modalContainer = new ModalContainer(modal);
    this.sidekick?.shadowRoot?.querySelector('theme-wrapper').appendChild(modalContainer);

    return modalContainer;
  }

  /*
   * Returns the current environment or an empty string.
   * @returns {string} the current environment
   */
  getEnv() {
    return [
      'isEditor',
      'isPreview',
      'isLive',
      'isProd',
      'isAdmin',
      'isDev',
    ]
      .filter((method) => this[method]())
      .map((method) => method.substring(2)) // cut off 'is'
      .join('')
      .toLowerCase();
  }

  /**
   * Displays a wait modal
   * @param {string} [message] The message to display
   */
  showWait(message) {
    if (!message) {
      message = this.i18n('please_wait');
    }

    return this.showModal({
      type: MODALS.WAIT,
      data: { message },
    });
  }

  /**
   * Hides the modal
   */
  hideWait() {
    EventBus.instance.dispatchEvent(new CustomEvent(MODAL_EVENTS.CLOSE));
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
  // istanbul ignore next 3
  loadPage(url) {
    window.location.href = url;
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
        detail: { data },
      }));
      const userEvents = [
        'shown',
        'hidden',
        'updated',
        'previewed',
        'published',
        'unpublished',
        'deleted',
        'envswitched',
        'loggedin',
        'loggedout',
        'helpnext',
        'helpdismissed',
        'helpacknowlegded',
        'helpoptedout',
      ];
      if (name.startsWith('custom:') || userEvents.includes(name)) {
        /* istanbul ignore next */
        sampleRUM(`sidekick:${name}`, {
          source: data?.sourceUrl || this.location.href,
          target: data?.targetUrl || this.status.webPath,
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
   * @param {string} message The message to display
   * @param {string} [variant] The variant of the toast (optional)
   * @param {number} [timeout] The timeout in milliseconds (optional)
   */
  showToast(message, variant = 'info', timeout = 6000) {
    const existingToast = this.sidekick?.shadowRoot?.querySelector('theme-wrapper').querySelector('toast-container');
    if (existingToast) {
      existingToast.remove();
    }

    const toastContainer = new ToastContainer({
      message,
      variant,
      timeout,
    });
    this.sidekick?.shadowRoot?.querySelector('theme-wrapper').appendChild(toastContainer);

    return toastContainer;
  }

  /**
     * Fetches the status for the current resource.
     * @fires Sidekick#statusfetched
     * @param {boolean} [refreshLocation] Refresh the sidekick's location (optional)
     */
  fetchStatus(refreshLocation) {
    if (refreshLocation) {
      this.location = getLocation();
    }
    const { owner, repo, ref } = this.siteStore;
    if (!owner || !repo || !ref) {
      return;
    }
    if (!this.status.apiUrl || refreshLocation) {
      const { href, pathname } = this.location;
      const isDM = this.isEditor() || this.isAdmin(); // is document management
      const apiUrl = getAdminUrl(
        this.siteStore,
        'status',
        isDM ? '' : pathname,
      );
      apiUrl.searchParams.append('editUrl', isDM ? href : 'auto');
      this.status.apiUrl = apiUrl;
    }

    fetch(this.status.apiUrl, {
      ...getAdminFetchOptions(),
    })
      .then((resp) => {
        // check for error status
        if (!resp.ok) {
          let errorKey = '';
          switch (resp.status) {
            case 401:
              // unauthorized, ask user to log in
              return {
                json: () => ({
                  status: 401,
                }),
              };
            case 404:
              errorKey = this.isEditor()
                ? 'error_status_404_document'
                : 'error_status_404_content';
              break;
            default:
              errorKey = `error_status_${resp.status}`;
          }
          throw new Error(errorKey);
        }
        return resp;
      })
      .then(async (resp) => {
        try {
          return resp.json();
        } catch (e) {
          /* istanbul ignore next */
          throw new Error('error_status_invalid');
        }
      })
      .then((json) => {
        this.updateStatus(json);
        return json;
      })
      .then((json) => this.fireEvent(EXTERNAL_EVENTS.STATUS_FETCHED, json))
      .catch(({ message }) => {
        this.status.error = message;
        // TODO: Setup modals
        // const modal = {
        //   message: message.startsWith('error_') ? i18n(this, message) : [
        //     i18n(this, 'error_status_fatal'),
        //     'https://status.hlx.live/',
        //   ],
        //   sticky: true,
        //   level: 0,
        //   callback: () => {
        //     // this error is fatal, hide and delete sidekick
        //     if (window.hlx.sidekick) {
        //       window.hlx.sidekick.hide();
        //       window.hlx.sidekick.replaceWith(''); // remove() doesn't work for custom element
        //       delete window.hlx.sidekick;
        //     }
        //   },
        // };
        // this.showModal(modal);
      });
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
   * @fires Sidekick#updated
   * @fires Sidekick#previewed
   * @returns {Promise<AdminResponse>} The response object
   */
  async update(path) {
    const { siteStore, status } = this;
    path = path || status.webPath;
    let resp;
    let respPath;
    try {
      // update preview
      resp = await fetch(
        getAdminUrl(siteStore, this.isContent() ? 'preview' : 'code', path),
        {
          method: 'POST',
          ...getAdminFetchOptions(),
        },
      );
      if (resp.ok) {
        if (this.isEditor() || this.isPreview() || this.isDev()) {
          // bust client cache
          await fetch(`https://${siteStore.innerHost}${path}`, { cache: 'reload', mode: 'no-cors' });
        }
        respPath = (await resp.json()).webPath;

        // @deprecated for content, use for code only
        this.fireEvent(EXTERNAL_EVENTS.RESOURCE_UPDATED, respPath);
        if (this.isContent()) {
          this.fireEvent(EXTERNAL_EVENTS.RESOURCE_PREVIEWED, respPath);
        }
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('failed to update', path, e);
    }
    return {
      ok: (resp && resp.ok) || false,
      status: (resp && resp.status) || 0,
      error: (resp && resp.headers.get('x-error')) || '',
      path: respPath || path,
    };
  }

  async updatePreview(ranBefore) {
    this.showWait();
    const { status } = this;
    const resp = await this.update();
    if (!resp.ok) {
      if (!ranBefore) {
        // assume document has been renamed, re-fetch status and try again
        this.sidekick.addEventListener('statusfetched', async () => {
          this.updatePreview(true);
        }, { once: true });
        this.fetchStatus();
      } else if (status.webPath.startsWith('/.helix/') && resp.error) {
        this.showModal({
          type: MODALS.ERROR,
          data: {
            message: `${this.i18n('error_config_failure')}${resp.error}`,
          },
        });
      } else {
        // eslint-disable-next-line no-console
        console.error(resp);
        this.showModal({
          type: MODALS.ERROR,
          data: {
            message: this.i18n('error_preview_failure'),
          },
        });
      }
      return;
    }
    // handle special case /.helix/*
    if (status.webPath.startsWith('/.helix/')) {
      this.showToast(this.i18n('preview_config_success'), 'positive');
      this.hideWait();
      return;
    }
    this.hideWait();
    this.switchEnv('preview');
  }

  /**
   * Deletes the current resource from preview and unpublishes it if published.
   * @fires Sidekick#deleted
   * @returns {Promise<AdminResponse>} The response object
   */
  async delete() {
    const { siteStore, status } = this;
    const path = status.webPath;

    // delete content only
    if (!this.isContent()) {
      return null;
    }

    /**
     * @type {AdminResponse}
     */
    let resp = {};
    try {
      // delete preview
      resp = await fetch(
        getAdminUrl(siteStore, 'preview', path),
        {
          method: 'DELETE',
          ...getAdminFetchOptions(),
        },
      );
      // also unpublish if published
      if (status.live && status.live.lastModified) {
        await this.unpublish();
      }
      this.fireEvent(EXTERNAL_EVENTS.RESOURCE_DELETED, path);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('failed to delete', path, e);
      resp.error = e.message;
    }
    return {
      ok: resp.ok || false,
      status: resp.status || 0,
      error: (resp.headers && resp.headers.get('x-error')) || resp.error || '',
      path,
    };
  }

  /**
   * Publishes the page at the specified path if <code>config.host</code> is defined.
   * @param {string} path The path of the page to publish
   * @fires Sidekick#published
   * @returns {Promise<AdminResponse>} The response object
   */
  async publish(path) {
    const { siteStore, location } = this;

    // publish content only
    if (!this.isContent()) {
      return null;
    }

    const purgeURL = new URL(path, this.isEditor()
      ? `https://${siteStore.innerHost}/`
      : location.href);

    // eslint-disable-next-line no-console
    console.log(`publishing ${purgeURL.pathname}`);

    /**
     * @type {AdminResponse}
     */
    let resp = {};
    try {
      resp = await fetch(
        getAdminUrl(siteStore, 'live', purgeURL.pathname),
        {
          method: 'POST',
          ...getAdminFetchOptions(),
        },
      );

      // bust client cache for live and production
      if (siteStore.outerHost) {
        // reuse purgeURL to ensure page relative paths (e.g. when publishing dependencies)
        await fetch(`https://${siteStore.outerHost}${purgeURL.pathname}`, { cache: 'reload', mode: 'no-cors' });
      }
      if (siteStore.host) {
        // reuse purgeURL to ensure page relative paths (e.g. when publishing dependencies)
        await fetch(`https://${siteStore.host}${purgeURL.pathname}`, { cache: 'reload', mode: 'no-cors' });
      }
      this.fireEvent(EXTERNAL_EVENTS.RESOURCE_PUBLISHED, path);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('failed to publish', path, e);
      resp.error = e.message;
    }
    resp.path = path;
    resp.error = (resp.headers && resp.headers.get('x-error')) || resp.error || '';
    return resp;
  }

  /**
   * Unpublishes the current page.
   * @fires Sidekick#unpublished
   * @returns {Promise<AdminResponse>} The response object
   */
  async unpublish() {
    // unpublish content only
    if (!this.isContent()) {
      return null;
    }
    const { siteStore, status } = this;
    const path = status.webPath;

    /**
     * @type {AdminResponse}
     */
    let resp = {};
    try {
      // delete live
      resp = await fetch(
        getAdminUrl(siteStore, 'live', path),
        {
          method: 'DELETE',
          ...getAdminFetchOptions(),
        },
      );
      this.fireEvent(EXTERNAL_EVENTS.RESOURCE_UNPUBLISHED, path);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('failed to unpublish', path, e);
      resp.error = e.message;
    }
    resp.path = path;
    resp.error = (resp.headers && resp.headers.get('x-error')) || resp.error || '';
    return resp;
  }

  /**
   * Switches to (or opens) a given environment.
   * @param {string} targetEnv One of the following environments:
   *        edit, dev, preview, live or prod
   * @param {boolean} [open] true if environment should be opened in new tab
   * @fires Sidekick#envswitched
   */
  switchEnv(targetEnv, open = false) {
    this.showWait();
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
      envUrl = status.edit && status.edit.url;
    }

    // TODO: Setup custom views
    // const [customView] = findViews(this, VIEWS.CUSTOM);
    // if (customView) {
    //   const customViewUrl = new URL(customView.viewer, envUrl);
    //   customViewUrl.searchParams.set('path', status.webPath);
    //   envUrl = customViewUrl;
    // }
    // switch or open env
    if (open || this.isEditor()) {
      this.openPage(envUrl, open
        ? '' : `hlx-sk-env--${siteStore.owner}/${siteStore.repo}/${siteStore.ref}${status.webPath}`);
    } else {
      this.loadPage(envUrl);
    }
    this.fireEvent(EXTERNAL_EVENTS.EVIRONMENT_SWITCHED, {
      sourceUrl: href,
      targetUrl: envUrl,
    });
    this.hideWait();
  }

  /**
   * Retrieves the profile of the current user.
   * @returns {Promise<Object | false>} The response object
   */
  async getProfile() {
    try {
      const url = getAdminUrl(this.siteStore, 'profile');
      const opts = getAdminFetchOptions();
      const res = await fetch(url, opts);

      if (!res.ok) {
        return false;
      }

      const response = await res.json();
      if (response.status === 200) {
        return response.profile;
      }
      return false;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch profile:', error);
      return false;
    }
  }

  /**
   * Logs the user in.
   * @param {boolean} selectAccount <code>true</code> to allow user to select account (optional)
   */
  login(selectAccount) {
    this.showWait(this.i18n('login_wait'));
    const loginUrl = getAdminUrl(this.siteStore, 'login');
    let extensionId = window.chrome?.runtime?.id;
    // istanbul ignore next 3
    if (!extensionId || window.navigator.vendor.includes('Apple')) { // exclude safari
      extensionId = 'cookie';
    }
    loginUrl.searchParams.set('extensionId', extensionId);
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
          this.sidekick.addEventListener('statusfetched', () => this.hideWait(), { once: true });
          await this.siteStore.initStore(siteStore);
          this.siteStore.authTokenExpiry = (
            window.hlx
            && window.hlx.sidekickConfig
            && window.hlx.sidekickConfig.authTokenExpiry) || 0;
          this.setupPlugins();
          // encourageLogin(sk, false);
          this.fetchStatus();
          this.fireEvent('loggedin');
          this.hideWait();
          return;
        }
        if (attempts >= 5) {
          // give up after 5 attempts
          this.showModal({
            type: MODALS.ERROR,
            data: {
              message: this.i18n('error_login_timeout'),
            },
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
    this.showWait();
    const logoutUrl = getAdminUrl(this.siteStore, 'logout');
    let extensionId = window.chrome?.runtime?.id;
    // istanbul ignore next 3
    if (!extensionId || window.navigator.vendor.includes('Apple')) { // exclude safari
      extensionId = 'cookie';
    }
    logoutUrl.searchParams.set('extensionId', extensionId);
    const logoutWindow = this.openPage(logoutUrl.toString());

    let attempts = 0;

    async function checkLoggedOut() {
      // istanbul ignore else
      if (logoutWindow.closed) {
        attempts += 1;
        // try 5 times after login window has been closed
        this.status.profile = await this.getProfile();
        if (!this.status.profile) {
          delete this.status.profile;
          delete this.siteStore.authTokenExpiry;
          this.sidekick.addEventListener('statusfetched', () => this.hideWait(), { once: true });
          this.siteStore.authorized = false;
          this.setupPlugins();
          this.fetchStatus();
          this.fireEvent('loggedout');
          return;
        }
        if (attempts >= 5) {
          this.showModal({
            type: MODALS.ERROR,
            data: {
              message: this.i18n('error_logout_error'),
            },
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
      if (exp > now) {
        // token is expired
        this.login(true);
        this.sidekick.addEventListener('statusfetched', () => {
          // wait will be hidden by login, show again
          this.showWait();
          resolve();
        }, { once: true });
      } else {
        resolve();
      }
    });
  }
}

export const appStore = new AppStore();
