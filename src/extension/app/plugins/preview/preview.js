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

import { Plugin } from '../../components/plugin/plugin.js';
import { EXTERNAL_EVENTS } from '../../constants.js';

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
        const { location } = appStore;
        const status = await appStore.fetchStatus(false, true, true);
        if (status.edit?.illegalPath) {
          appStore.showToast(
            appStore.i18n('bulk_error_illegal_file_name')
              .replace('$1', status.webPath),
            'warning',
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            3600000, // keep for 1 hour
          );
          return;
        }
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

            // istanbul ignore else
            if (isMsDocMime) {
              errorKey = 'error_preview_not_gdoc_ms_word';
            } else if (isMsExcelSheet) {
              errorKey = 'error_preview_not_gsheet_ms_excel';
            }

            appStore.showToast(
              appStore.i18n(errorKey),
              'negative',
              () => appStore.closeToast(),
            );

            return;
          }
        }
        if (location.pathname.startsWith('/:x:/')) {
          // refresh excel with preview param
          window.sessionStorage.setItem('aem-sk-preview', JSON.stringify({
            previewPath: status.webPath,
            previewTimestamp: Date.now(),
          }));
          appStore.reloadPage();
        } else {
          appStore.updatePreview();
          appStore.fireEvent(
            EXTERNAL_EVENTS.RESOURCE_PREVIEWED,
            appStore.status.webPath,
          );
        }
      },
      isEnabled: (store) => store.isAuthorized('preview', 'write')
          && store.status.webPath,
    },
    callback: (store) => {
      const { previewPath, previewTimestamp } = JSON
        .parse(window.sessionStorage.getItem('aem-sk-preview') || '{}');
      window.sessionStorage.removeItem('aem-sk-preview');
      if (previewTimestamp < Date.now() + 60000) {
        const { status } = appStore;
        /* istanbul ignore else  */
        if (status.webPath === previewPath && appStore.isAuthorized('preview', 'write')) {
          // update preview and remove preview request from session storage
          appStore.updatePreview();
        } else {
          appStore.closeToast();
        }
      }
      if (store.status.webPath) {
        const { button } = store.corePlugins['edit-preview'].config;
        button.text = store.status.webPath.startsWith('/.helix')
          ? store.i18n('activate') // special button text for config files
          : store.i18n('preview');
      }
    },
  },
  appStore);
}
