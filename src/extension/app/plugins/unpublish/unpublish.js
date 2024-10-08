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
 * Creates the unpublish plugin
 * @param {AppStore} appStore The app store
 * @returns {Plugin} The unpublish plugin
 */
export function createUnpublishPlugin(appStore) {
  return new Plugin({
    id: 'unpublish',
    condition: (store) => store.isProject() // only enable in project env
      && store.isAuthorized('live', 'delete') // if user authorized to unpublish
      && store.status.live?.status === 200 // and page published
      && store.status.code?.status !== 200 // and not code
      && !RESTRICTED_PATHS.includes(store.location.pathname), // and not restricted path
    pinned: false,
    button: {
      text: appStore.i18n('unpublish'),
      action: async (evt) => {
        // get user confirmation
        const message = appStore.i18n('unpublish_page_confirm');
        const modal = appStore.showModal({
          type: MODALS.DELETE,
          data: {
            headline: appStore.i18n('unpublish'),
            message,
            confirmLabel: appStore.i18n('unpublish'),
            action: 'UNPUBLISH',
          },
        });
        modal.addEventListener(MODAL_EVENTS.CONFIRM, async () => {
          // perform unpublish
          const res = await appStore.unpublish();
          if (res) {
            const timeoutCallback = () => {
              appStore.reloadPage(newTab(evt));
            };

            // show success toast
            appStore.showToast({
              message: appStore.i18n('unpublish_page_success'),
              variant: 'positive',
              timeoutCallback,
            });
            appStore.fireEvent(EXTERNAL_EVENTS.RESOURCE_UNPUBLISHED);
            appStore.fireEvent(
              EXTERNAL_EVENTS.RESOURCE_UNPUBLISHED,
              appStore.status.webPath,
            );
          }
        });
      },
    },
  },
  appStore);
}
