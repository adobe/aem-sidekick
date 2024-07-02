/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { Plugin } from '../../components/plugin/plugin.js';

/**
 * @typedef {import('@AppStore').AppStore} AppStore
 */

/**
 * @typedef {import('@Types').CorePlugin} CorePlugin
 */

/**
 * Creates an environment-specific plugin.
 * @param {AppStore} appStore The app store
 * @param {string} env The environment
 * @param {string} [host] The host name (default: preview host)
 * @param {Function} [condition] The condition function (expected to return a boolean)
 * @returns {Plugin} The plugin
 */
function createPlugin(appStore, env, host, condition = () => true) {
  return new Plugin({
    id: `bulk-copy-${env}-urls`,
    condition: (store) => store.isAdmin()
      && store.bulkStore?.selection.length > 0
      && !store.status?.webPath?.startsWith('/.helix')
      && condition(),
    container: 'bulk-copy-urls',
    button: {
      text: appStore.i18n(`copy_${env}_urls`),
      action: async () => {
        const { bulkStore } = appStore;
        await bulkStore.copyUrls(host);
      },
    },
  },
  appStore);
}

/**
 * Creates the bulk copy URLs plugin.
 * @param {AppStore} appStore The app store
 * @returns {Plugin} The bulk copy URLs plugin
 */
export function createBulkCopyUrlsPlugin(appStore) {
  return new Plugin({
    id: 'bulk-copy-urls',
    condition: (store) => store.isAdmin() && store.bulkStore?.selection.length > 0,
    button: {
      isDropdown: true,
      text: appStore.i18n('copy_urls').replace('$1', ''),
    },
  },
  appStore);
}

/**
 * Creates the bulk copy preview URLs plugin.
 * @param {AppStore} appStore The app store
 * @returns {Plugin} The bulk copy preview URLs plugin
 */
export function createBulkCopyPreviewUrlsPlugin(appStore) {
  return createPlugin(
    appStore,
    'preview',
  );
}

/**
 * Creates the bulk copy live URLs plugin
 * @param {AppStore} appStore The app store
 * @returns {Plugin} The bulk copy live URLs plugin
 */
export function createBulkCopyLiveUrlsPlugin(appStore) {
  const { siteStore } = appStore;
  return createPlugin(
    appStore,
    'live',
    siteStore.outerHost,
    () => !siteStore.host,
  );
}

/**
 * Creates the bulk copy production URLs plugin
 * @param {AppStore} appStore The app store
 * @returns {Plugin} The bulk copy production URLs plugin
 */
export function createBulkCopyProdUrlsPlugin(appStore) {
  const { siteStore } = appStore;
  return createPlugin(
    appStore,
    'prod',
    siteStore.host,
    () => !!siteStore.host,
  );
}
