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
 * @returns {Plugin} The publish plugin
 */
export function createPublishPlugin(appStore) {
  return new Plugin({
    id: 'publish',
    condition: (store) => store.isProject() && store.isContent(),
    button: {
      text: appStore.i18n('publish'),
      action: async (evt) => {
        const { siteStore } = appStore;
        const res = await appStore.publish();
        if (res) {
          const actionCallback = async () => {
            const redirectHost = siteStore.host || siteStore.outerHost;
            const isSameHost = redirectHost === appStore.location.host;
            if (isSameHost) {
              const path = appStore.location.pathname;
              const prodURL = new URL(path, `https://${redirectHost}`);
              await fetch(prodURL, { cache: 'reload', mode: 'no-cors' });
            }

            appStore.switchEnv('prod', newTab(evt), !isSameHost);
            appStore.closeToast();
          };

          const closeCallback = () => {
            appStore.closeToast();
          };

          const { host } = siteStore;
          const targetEnv = host ? 'production' : 'live';
          appStore.showToast(
            appStore.i18n('publish_success').replace('$1', appStore.i18n(targetEnv)),
            'positive',
            closeCallback,
            actionCallback,
            appStore.i18n('open'),
          );
        }
      },
      isEnabled: (store) => store.isAuthorized('live', 'write') // only enable if authorized
        && store.status.preview && store.status.preview.status === 200, // and page previewed
    },
  },
  appStore);
}
