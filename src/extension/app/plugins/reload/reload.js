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

import { MODALS } from '../../constants.js';
import { Plugin } from '../../components/plugin/plugin.js';
import { newTab } from '../../utils/browser.js';
import { i18n } from '../../utils/i18n.js';

/**
 * @typedef {import('@AppStore').AppStore} AppStore
 */

/**
 * @typedef {import('@Types').CorePlugin} CorePlugin
 */

/**
 * Creates the reload plugin
 * @param {AppStore} appStore The app store
 * @returns {Plugin} The reload plugin
 */
export function createReloadPlugin(appStore) {
  return new Plugin({
    id: 'reload',
    condition: (store) => store.isPreview() || store.isDev(),
    button: {
      text: i18n(appStore.languageDict, 'reload'),
      action: async (evt) => {
        appStore.showWait();
        try {
          const resp = await appStore.update();
          if (!resp.ok && resp.status >= 400) {
            // eslint-disable-next-line no-console
            console.error(resp);
            throw new Error(resp.headers['x-error'] || resp.status);
          }
          appStore.hideWait();
          appStore.reloadPage(newTab(evt));
        } catch (e) {
          appStore.showModal({
            type: MODALS.ERROR,
            data: {
              message: appStore.i18n('reload_failure'),
            },
          });
        }
      },
      isEnabled: (store) => store.isAuthorized('preview', 'write')
        && store.status.edit && store.status.edit.url, // enable only if edit url exists
    },
  },
  appStore);
}
