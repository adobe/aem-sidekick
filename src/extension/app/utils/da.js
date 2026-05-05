/*
 * Copyright 2026 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/* eslint-disable no-console */

/**
 * @typedef {import('@AppStore').AppStore} AppStore
 */

let listenersAttached = false;
let wasDaCollab = false;
let wasQuickEdit = false;

/**
 * Disables collaboration mode.
 * @param {AppStore} appStore The app store
 */
export function disableCollab(appStore) {
  if (!appStore.collabMode) {
    return;
  }
  appStore.collabMode = false;
  console.log('collab disabled');
}

/**
 * Disables inline editing mode.
 * @param {AppStore} appStore The app store
 */
export function disableInlineEditing(appStore) {
  if (!appStore.inlineEditingMode) {
    return;
  }
  appStore.inlineEditingMode = false;
  console.log('inline editing disabled');
}

/**
 * Enables inline editing mode.
 * @param {AppStore} appStore The app store
 */
export function enableInlineEditing(appStore) {
  if (appStore.inlineEditingMode) {
    return;
  }
  appStore.inlineEditingMode = true;
  console.log('inline editing enabled');
  appStore.showToast({
    message: appStore.i18n('edit_inline'),
    variant: 'info',
    closeCallback: () => disableInlineEditing(appStore),
    timeout: 0,
  });
}

/**
 * Enables collaboration mode and attaches lifecycle listeners on first call.
 * @param {AppStore} appStore The app store
 */
export function enableCollab(appStore) {
  if (appStore.collabMode) {
    return;
  }
  appStore.collabMode = true;
  console.log('collab enabled');

  const { sidekick } = appStore;
  if (!sidekick || listenersAttached) {
    return;
  }

  listenersAttached = true;

  const saveAndDisable = () => {
    wasDaCollab = appStore.collabMode;
    wasQuickEdit = appStore.inlineEditingMode;
    disableCollab(appStore);
    disableInlineEditing(appStore);
  };

  sidekick.addEventListener('hidden', saveAndDisable);

  sidekick.addEventListener('toggled', (/** @type {CustomEvent} */ { detail }) => {
    if (detail?.display) {
      if (wasDaCollab) {
        enableCollab(appStore);
        if (wasQuickEdit) {
          enableInlineEditing(appStore);
        }
      }
    } else {
      saveAndDisable();
    }
  });
}

/**
 * Resets the module state. Only used for testing.
 */
export function resetDAState() {
  listenersAttached = false;
  wasDaCollab = false;
  wasQuickEdit = false;
}
