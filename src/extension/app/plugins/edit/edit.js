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

import { i18n } from '../../utils/i18n.js';
import sampleRUM from '../../utils/rum.js';

/**
 * @typedef {import('@AppStore').AppStore} AppStore
 */

/**
 * @typedef {import('@Types').CorePlugin} CorePlugin
 */

/**
 * Creates the edit plugin
 * @param {AppStore} appStore The app store
 * @returns {CorePlugin} The edit plugin
 */
export function createEditPlugin(appStore) {
  return {
    id: 'edit',
    condition: (store) => !store.isEditor() && store.isProject(),
    button: {
      text: i18n(appStore.languageDict, 'edit'),
      action: async () => {
        const { siteStore, status } = appStore;
        const editUrl = status.edit && status.edit.url;
        window.open(
          editUrl,
            `hlx-sk-edit--${siteStore.owner}/${siteStore.repo}/${siteStore.ref}${status.webPath}`,
        );
        sampleRUM('sidekick:editoropened', {
          source: appStore.location.href,
          target: editUrl,
        });
      },
      isEnabled: (store) => store.status.edit && store.status.edit.url,
    },
  };
}
