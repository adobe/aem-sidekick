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

import { Plugin } from '../../components/plugin/plugin.js';

/**
 * @typedef {import('@AppStore').AppStore} AppStore
 */

/**
 * @typedef {import('@Types').CorePlugin} CorePlugin
 */

/**
 * Creates the reload (purge cache) plugin. Purges all browser caches for the current
 * site using chrome.browsingData and reloads the page.
 * @param {AppStore} appStore The app store
 * @returns {Plugin} The reload-cache plugin
 */
export function createReloadCachePlugin(appStore) {
  return new Plugin({
    id: 'reload-cache',
    condition: (store) => store.isContent() && (
      store.isPreview() || store.isLive() || store.isReview() || store.isProd()
    ),
    button: {
      text: appStore.i18n('reload_clear_cache'),
      action: async () => {
        appStore.showToast({
          message: appStore.i18n('reload_clear_cache_state'),
          variant: 'info',
        });
        await chrome.runtime.sendMessage({ action: 'purgeCacheAndReload' });
      },
    },
  }, appStore);
}
