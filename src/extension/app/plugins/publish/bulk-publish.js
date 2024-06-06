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
 * Creates the bulk publish plugin
 * @param {AppStore} appStore The app store
 * @returns {Plugin} The bulk publish plugin
 */
export function createBulkPublishPlugin(appStore) {
  return new Plugin({
    id: 'bulk-publish',
    condition: (store) => store.isAdmin() && store.bulkStore?.selection.length > 0,
    button: {
      text: appStore.i18n('publish'),
      action: () => {
        const { bulkStore } = appStore;
        const confirmText = bulkStore.getConfirmText('publish', bulkStore.selection.length);
        const modal = appStore.showModal({
          type: 'confirm',
          data: {
            headline: appStore.i18n('publish'),
            message: confirmText,
            confirmLabel: appStore.i18n('publish'),
          },
        });
        modal.addEventListener(MODAL_EVENTS.CONFIRM, async () => {
          const res = await bulkStore.publish();
          if (res) {
            bulkStore.showSummary(
              'publish',
              res.data?.resources || [],
              appStore.siteStore.host || appStore.siteStore.outerHost,
            );
          }
        }, { once: true });
      },
      isEnabled: (store) => store.isAuthorized('live', 'write'), // only enable if authorized
    },
  },
  appStore);
}
