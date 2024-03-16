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
import { newTab } from '../../utils/browser.js';

/**
 * @typedef {import('@AppStore').AppStore} AppStore
 */

/**
 * @typedef {import('@Types').CorePlugin} CorePlugin
 */

/**
 * Creates the publish plugin
 * @param {AppStore} appStore The app store
 * @returns {SidekickPlugin} The publish plugin
 */
export function createPublishPlugin(appStore) {
  return new SidekickPlugin({
    id: 'publish',
    condition: (store) => store.isProject() && store.isContent(),
    button: {
      text: appStore.i18n('publish'),
      action: async (evt) => {
        const { location } = appStore;
        const path = location.pathname;
        appStore.showWait();
        const res = await appStore.publish(path);
        if (res.ok) {
          appStore.hideWait();
          appStore.switchEnv('prod', newTab(evt));
        } else {
          // eslint-disable-next-line no-console
          console.error(res);

          appStore.showModal({
            type: MODALS.ERROR,
            data: {
              message: appStore.i18n('publish_failure'),
            },
          });
        }
      },
      isEnabled: (store) => store.isAuthorized('live', 'write') && store.status.edit
          && store.status.edit.url, // enable only if edit url exists
    },
    appStore,
  });
}
