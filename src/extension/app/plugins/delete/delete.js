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
import { SidekickPlugin } from '../../components/plugin/plugin.js';
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
 * Creates the delete plugin
 * @param {AppStore} appStore The app store
 * @returns {SidekickPlugin} The delete plugin
 */
export function createDeletePlugin(appStore) {
  return new SidekickPlugin({
    id: 'delete',
    condition: (store) => store.isPreview()
      && store.status.code?.status !== 200 // // only show if not code
      && !RESTRICTED_PATHS.includes(store.location.pathname), // or restricted path
    // pinned: false, // TODO: set to unpinned
    button: {
      text: appStore.i18n('delete'),
      action: async () => {
        const { location, status } = appStore;
        const isPage = status.webPath.split('/').pop().indexOf('.') === -1;
        const hasSrc = status.edit?.status === 200;

        // double check
        if (hasSrc && !appStore.isAuthenticated()) {
          const message = isPage
            ? appStore.i18n('delete_page_source_exists')
            : appStore.i18n('delete_file_source_exists');
          appStore.showToast(message, 'negative');
          return;
        }

        // get user confirmation
        const message = isPage
          ? appStore.i18n(hasSrc ? 'delete_page_confirm' : 'delete_page_no_source_confirm')
          : appStore.i18n(hasSrc ? 'delete_file_confirm' : 'delete_file_no_source_confirm');
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
          appStore.showWait();
          try {
            const resp = await appStore.delete();
            appStore.hideWait();
            if (resp.ok) {
              // show success toast
              const toast = appStore.showToast(
                isPage
                  ? appStore.i18n('delete_page_success')
                  : appStore.i18n('delete_file_success'),
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
                message: appStore.i18n('delete_failure'),
              },
            });
          }
        });
      },
      isEnabled: (store) => store.isAuthorized('preview', 'delete') // only enable if authorized
        && store.status.preview && store.status.preview.status === 200, // and page previewed
    },
    appStore,
  });
}
