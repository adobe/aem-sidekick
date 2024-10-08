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

import { Plugin } from '../../components/plugin/plugin.js';
import { EXTERNAL_EVENTS } from '../../constants.js';
import { newTab } from '../../utils/browser.js';

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
    condition: (store) => store.isContent() && (store.isPreview() || store.isDev()),
    button: {
      text: appStore.i18n('update'),
      action: async (evt) => {
        const res = await appStore.update();
        if (res) {
          appStore.showToast({
            message: appStore.i18n('update_success'),
            variant: 'positive',
          });
          appStore.fireEvent(EXTERNAL_EVENTS.RESOURCE_UPDATED);
          appStore.reloadPage(newTab(evt));
        }
      },
      isEnabled: (store) => store.isAuthorized('preview', 'write'),
    },
  },
  appStore);
}
