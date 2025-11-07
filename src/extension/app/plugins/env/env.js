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

/**
 * @typedef {import('@AppStore').AppStore} AppStore
 */

/**
 * @typedef {import('@Types').CorePlugin} CorePlugin
 */

/**
 * Returns the current environment (edit, dev, preview, review, live, prod).
 * @param {AppStore} appStore The app store
 * @returns {string|undefined} The current environment, or undefined if unknown
 */
function getCurrentEnv(appStore) {
  if (appStore.isEditor()) {
    return 'edit';
  }
  if (appStore.isDev()) {
    return 'dev';
  }
  if (appStore.isPreview()) {
    return 'preview';
  }
  if (appStore.isReview()) {
    return 'review';
  }
  if (appStore.isLive()) {
    return 'live';
  }
  if (appStore.isProd()) {
    return 'prod';
  }
  return undefined;
}

/**
 * Creates the env plugin
 * @param {AppStore} appStore The app store
 * @returns {Plugin} The env plugin
 */
export function createEnvPlugin(appStore) {
  return new Plugin({
    id: 'env-switcher',
    button: {
      text: appStore.i18n(getCurrentEnv(appStore)),
    },
    condition: (store) => !store.isAdmin(),
  },
  appStore);
}
