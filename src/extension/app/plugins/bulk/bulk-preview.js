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
 * Creates the bulk preview plugin
 * @param {AppStore} appStore The app store
 * @returns {Plugin} The bulk preview plugin
 */
export function createBulkPreviewPlugin(appStore) {
  return new Plugin({
    id: 'bulk-preview',
    condition: (store) => store.isAdmin() && store.bulkStore?.selection.length > 0,
    button: {
      text: appStore.i18n('preview'),
      action: async () => {
        appStore.bulkStore.preview();
      },
      isEnabled: (store) => store.isAuthorized('preview', 'write'), // only enable if authorized
    },
  },
  appStore);
}
