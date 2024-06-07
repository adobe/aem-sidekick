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
import { MODAL_EVENTS } from '../../constants.js';

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
        const { bulkStore } = appStore;
        const confirmText = bulkStore.getConfirmText('preview', bulkStore.selection.length);
        const modal = appStore.showModal({
          type: 'confirm',
          data: {
            headline: appStore.i18n('preview'),
            message: confirmText,
            confirmLabel: appStore.i18n('preview'),
          },
        });
        modal.addEventListener(MODAL_EVENTS.CONFIRM, async () => {
          const res = await bulkStore.preview();
          if (res) {
            bulkStore.showSummary(
              'preview', res.data?.resources || [], appStore.siteStore.innerHost,
            );
          }
        }, { once: true });
      },
      isEnabled: (store) => store.isAuthorized('preview', 'write'), // only enable if authorized
    },
  },
  appStore);
}
