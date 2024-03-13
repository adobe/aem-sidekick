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

import { log } from '../../../log.js';
import { SidekickPlugin } from '../../components/plugin/plugin.js';
import { EVENTS, MODALS /* , RESTRICTED_PATHS */ } from '../../constants.js';
import { EventBus } from '../../utils/event-bus.js';

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
    condition: (store) => store.isProject(),
    // pinned: false,
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
          appStore.showToast(message, 'negative', 60000);
          // return;
        }
        // get user confirmation
        const message = isPage
          ? appStore.i18n(hasSrc ? 'delete_page_confirm' : 'delete_page_no_source_confirm')
          : appStore.i18n(hasSrc ? 'delete_file_confirm' : 'delete_file_no_source_confirm');
        appStore.showConfirm(
          message,
          async () => {
            appStore.showWait();
            try {
              // const resp = await appStore.delete();
              const resp = new Response('', { status: 200 });
              appStore.hideWait();
              if (!resp.ok && resp.status >= 400) {
                throw new Error(resp.headers?.['x-error']);
              }
              // show confirmation
              appStore.showToast(
                isPage
                  ? appStore.i18n('delete_page_success')
                  : appStore.i18n('delete_file_success'),
                'positive',
              );
              log.info(`redirecting to ${location.origin}/`);
              appStore.loadPage(`${location.origin}/`);
            } catch (e) {
              // eslint-disable-next-line no-console
              console.log(e);

              EventBus.instance.dispatchEvent(new CustomEvent(EVENTS.OPEN_MODAL, {
                detail: {
                  type: MODALS.ERROR,
                  data: {
                    message: appStore.i18n('delete_failure'),
                  },
                },
              }));
            }
          },
          appStore.i18n('delete'),
          true,
        );
      },
      isEnabled: (store) => store.status.preview && store.status.preview.status < 400,
      // isEnabled: (store) => store.isAuthorized('preview', 'delete') // only enable if authorized
      //   && store.status.code?.status !== 200 // not code
      //   && store.status.preview?.status < 400 // preview exists
      //   && !RESTRICTED_PATHS.includes(store.location.pathname), // no restricted path
    },
    appStore,
  });
}
