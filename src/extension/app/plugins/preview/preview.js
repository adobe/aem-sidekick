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

/**
 * @typedef {import('@AppStore').AppStore} AppStore
 */

/**
 * @typedef {import('@Types').CorePlugin} CorePlugin
 */

/**
 * Creates the preview plugin
 * @param {AppStore} appStore The app store
 * @returns {Plugin} The preview plugin
 */
export function createPreviewPlugin(appStore) {
  return new Plugin({
    id: 'edit-preview',
    condition: (store) => store.isEditor(),
    button: {
      text: appStore.i18n('preview'),
      action: async () => {
        const { status, location } = appStore;
        if (status.edit && status.edit.sourceLocation
            && status.edit.sourceLocation.startsWith('onedrive:')
            && !location.pathname.startsWith('/:x:/')) {
          // show ctrl/cmd + s hint on onedrive docs
          // istanbul ignore next
          const mac = navigator.platform.toLowerCase().includes('mac') ? '_mac' : '';
          appStore.showToast(appStore.i18n(`preview_onedrive${mac}`));
        } else if (status.edit.sourceLocation?.startsWith('gdrive:')) {
          const { contentType } = status.edit;

          const isGoogleDocMime = contentType === 'application/vnd.google-apps.document';
          const isGoogleSheetMime = contentType === 'application/vnd.google-apps.spreadsheet';
          const neitherGdocOrGSheet = !isGoogleDocMime && !isGoogleSheetMime;

          if (neitherGdocOrGSheet) {
            const isMsDocMime = contentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            const isMsExcelSheet = contentType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            let errorKey = 'error_preview_not_gdoc_generic'; // show generic message by default
            if (isMsDocMime) {
              errorKey = 'error_preview_not_gdoc_ms_word';
            } else if (isMsExcelSheet) {
              errorKey = 'error_preview_not_gsheet_ms_excel';
            }

            appStore.showModal({
              type: MODALS.ERROR,
              data: {
                message: appStore.i18n(errorKey),
              },
            });

            return;
          }
        }
        if (location.pathname.startsWith('/:x:/')) {
          // refresh excel with preview param
          window.sessionStorage.setItem('hlx-sk-preview', JSON.stringify({
            previewPath: status.webPath,
            previewTimestamp: Date.now(),
          }));
          appStore.reloadPage();
        } else {
          appStore.updatePreview();
        }
      },
      isEnabled: (store) => store.isAuthorized('preview', 'write')
          && store.status.webPath,
    },
    callback: () => {
      const { previewPath, previewTimestamp } = JSON
        .parse(window.sessionStorage.getItem('hlx-sk-preview') || '{}');
      window.sessionStorage.removeItem('hlx-sk-preview');
      if (previewTimestamp < Date.now() + 60000) {
        // preview request detected in session storage, wait for status...
        appStore.showWait();
        appStore.sidekick.addEventListener('statusfetched', async () => {
          const { status } = appStore;
          /* istanbul ignore else  */
          if (status.webPath === previewPath && appStore.isAuthorized('preview', 'write')) {
            // update preview and remove preview request from session storage
            appStore.updatePreview();
          } else {
            appStore.hideWait();
          }
        }, { once: true });
      }
    },
  },
  appStore);
}
