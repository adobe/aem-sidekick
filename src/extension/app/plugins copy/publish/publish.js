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

import { SIDEKICK_STATE } from '../../constants.js';
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
        const { location } = appStore;
        const path = location.pathname;
        appStore.setState(SIDEKICK_STATE.PUBLISHNG);
        const res = await appStore.publish(path);
        if (res.ok) {
          const actionCallback = () => {
            appStore.switchEnv('prod', newTab(evt));
          };

          const closeCallback = () => {
            appStore.closeToast();
          };

          appStore.showToast(i18n(appStore.languageDict, 'publish_success'), 'positive', closeCallback, actionCallback, 'Open');
        } else {
          // eslint-disable-next-line no-console
          console.error(res);
          appStore.showToast(
            appStore.i18n('publish_failure'),
            'negative',
            () => appStore.closeToast(),
          );
        }
      },
      isEnabled: (store) => store.isAuthorized('live', 'write') // only enable if authorized
        && store.status.preview && store.status.preview.status === 200, // and page previewed
    },
  },
  appStore);
}
