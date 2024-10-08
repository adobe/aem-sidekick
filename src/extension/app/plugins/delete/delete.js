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
import {
  EXTERNAL_EVENTS,
  MODALS,
  MODAL_EVENTS,
  RESTRICTED_PATHS,
} from '../../constants.js';
import { newTab } from '../../utils/browser.js';

/**
 * @typedef {import('@AppStore').AppStore} AppStore
 */

/**
 * @typedef {import('@Types').CorePlugin} CorePlugin
 */

/**
 * Creates the delete plugin
 * @param {AppStore} appStore The app store
 * @returns {Plugin} The delete plugin
 */
export function createDeletePlugin(appStore) {
  return new Plugin({
    id: 'delete',
    condition: (store) => store.isPreview() // only enable in preview
      && store.isAuthorized('preview', 'delete') // if user authorized to delete
      && store.status.preview?.status === 200 // and page previewed
      && store.status.code?.status !== 200 // and not code
      && !RESTRICTED_PATHS.includes(store.location.pathname), // and not restricted path
    pinned: false,
    button: {
      text: appStore.i18n('delete'),
      action: async (evt) => {
        const { status } = appStore;
        const isPage = status.webPath.split('/').pop().indexOf('.') === -1;

        // get user confirmation
        const message = isPage
          ? appStore.i18n('delete_page_confirm')
          : appStore.i18n('delete_file_confirm');
        const modal = appStore.showModal({
          type: MODALS.DELETE,
          data: {
            headline: appStore.i18n('delete'),
            message,
            confirmLabel: appStore.i18n('delete'),
          },
        });
        modal.addEventListener(MODAL_EVENTS.CONFIRM, async () => {
          // perform delete
          const res = await appStore.delete();
          if (res) {
            const timeoutCallback = () => {
              appStore.reloadPage(newTab(evt));
            };

            // show success toast
            appStore.showToast({
              message: isPage
                ? appStore.i18n('delete_page_success')
                : appStore.i18n('delete_file_success'),
              variant: 'positive',
              timeoutCallback,
            });
            appStore.fireEvent(
              EXTERNAL_EVENTS.RESOURCE_DELETED,
              appStore.status.webPath,
            );
          }
        });
      },
    },
  },
  appStore);
}
