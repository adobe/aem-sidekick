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

import { STATE } from '../../constants.js';
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
        appStore.setState(STATE.PREVIEWING);
        try {
          const resp = await appStore.update();
          if (!resp.ok && resp.status >= 400) {
            if (resp.status === 404) {
              appStore.showToast(appStore.i18n('error_status_preview_404'), 'negative');
              return;
            }
            throw new Error();
          }
          const closeHandler = () => {
            appStore.closeToast();
          };

          const actionHandler = () => {
            appStore.reloadPage(newTab(evt));
          };

          appStore.showToast(i18n(appStore.languageDict, 'reload_success'), 'positive', closeHandler, actionHandler, appStore.i18n('open'));
        } catch (e) {
          appStore.showToast(appStore.i18n('reload_failure'), 'negative');
        }
      },
      isEnabled: (store) => store.isAuthorized('preview', 'write'),
    },
  },
  appStore);
}
