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

import { log } from '../../../log.js';
import { Plugin } from '../../components/plugin/plugin.js';
import {
  MODALS, MODAL_EVENTS, TOAST_EVENTS, RESTRICTED_PATHS,
} from '../../constants.js';

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
    condition: (store) => store.isProject()
      && !RESTRICTED_PATHS.includes(store.location.pathname),
    pinned: false,
    button: {
      text: appStore.i18n('unpublish'),
      action: async () => {
        const { location, status } = appStore;
        const hasSrc = status.edit?.status === 200;

        // double check
        if (hasSrc && !appStore.isAuthenticated()) {
          appStore.showToast(appStore.i18n('unpublish_page_source_exists'), 'negative');
          return;
        }

        // get user confirmation
        const message = hasSrc
          ? appStore.i18n('unpublish_page_confirm')
          : appStore.i18n('unpublish_page_no_source_confirm');
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
          appStore.showWait();
          try {
            const resp = await appStore.unpublish();
            appStore.hideWait();
            if (resp.ok) {
              // show success toast
              const toast = appStore.showToast(
                appStore.i18n('unpublish_page_success'),
                'positive',
              );
              toast.addEventListener(TOAST_EVENTS.CLOSE, () => {
                log.info(`redirecting to ${location.origin}/`);
                appStore.loadPage(`${location.origin}/`);
              });
            } else {
              throw new Error(resp.headers?.['x-error']);
            }
          } catch (e) {
            // eslint-disable-next-line no-console
            appStore.showModal({
              type: MODALS.ERROR,
              data: {
                message: appStore.i18n('unpublish_failure'),
              },
            });
          }
        });
      },
      isEnabled: (store) => store.isAuthorized('live', 'delete') // only enable if authorized
        && store.status.live?.status === 200 // and page published
        && store.status.code?.status !== 200, // and not code
    },
    appStore,
  });
}
