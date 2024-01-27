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

import { EVENTS, MODALS } from '../../constants.js';
import { newTab } from '../../utils/browser.js';
import { EventBus } from '../../utils/event-bus.js';

/**
 * @typedef {import('@AppStore').AppStore} AppStore
 */

/**
 * @typedef {import('@Types').CorePlugin} CorePlugin
 */

/**
 * Creates the publish plugin
 * @param {AppStore} appStore The app store
 * @returns {CorePlugin} The publish plugin
 */
export function createPublishPlugin(appStore) {
  return {
    id: 'publish',
    condition: (store) => store.isProject() && store.isContent(),
    button: {
      text: appStore.i18n('publish'),
      action: async (evt) => {
        const { siteStore, location } = appStore;
        const path = location.pathname;
        appStore.showWait();
        let urls = [path];
        // purge dependencies
        if (Array.isArray(window.hlx.dependencies)) {
          urls = urls.concat(window.hlx.dependencies);
        }
        const results = await Promise.all(urls.map((url) => appStore.publish(url)));
        if (results.every((res) => res && res.ok)) {
          // fetch and redirect to production
          const redirectHost = siteStore.host || siteStore.outerHost;
          const prodURL = `https://${redirectHost}${path}`;

          // eslint-disable-next-line no-console
          console.log(`redirecting to ${prodURL}`);

          appStore.switchEnv('prod', newTab(evt));
        } else {
          // eslint-disable-next-line no-console
          console.error(results);

          EventBus.instance.dispatchEvent(new CustomEvent(EVENTS.OPEN_MODAL, {
            detail: {
              type: MODALS.ERROR,
              data: {
                message: appStore.i18n('publish_failure'),
              },
            },
          }));
        }
      },
      isEnabled: (sidekick) => sidekick.isAuthorized('live', 'write') && sidekick.status.edit
          && sidekick.status.edit.url, // enable only if edit url exists
    },
  };
}
