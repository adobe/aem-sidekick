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
import { i18n } from '../../utils/i18n.js';
import sampleRUM from '../../utils/rum.js';

/**
 * @typedef {import('@AppStore').AppStore} AppStore
 */

/**
 * @typedef {import('@Types')._Plugin} _Plugin
 */

export const pluginFactory = (() => {
  /**
   * Creates an env plugin
   * @returns {_Plugin} The env plugin
   */
  function createEnvPlugin() {
    return {
      id: 'env-switcher',
      condition: () => true,
    };
  }

  /**
   * Creates a edit plugin
   * @param {AppStore} appStore
   * @returns {_Plugin} The edit plugin
   */
  function createEditPlugin(appStore) {
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

  /**
   * Creates a preview plugin
   * @param {AppStore} appStore
   * @returns {_Plugin} The preview plugin
   */
  function createPreviewPlugin(appStore) {
    return {
      id: 'edit-preview',
      condition: (store) => store.isEditor(),
      button: {
        text: i18n(appStore.languageDict, 'preview'),
        action: async () => {
          const { status, location } = appStore;
          if (status.edit && status.edit.sourceLocation
            && status.edit.sourceLocation.startsWith('onedrive:')
            && !location.pathname.startsWith('/:x:/')) {
            // show ctrl/cmd + s hint on onedrive docs
            const mac = navigator.platform.toLowerCase().includes('mac') ? '_mac' : '';
            appStore.showToast(i18n(appStore.languageDict, `preview_onedrive${mac}`));
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

              EventBus.instance.dispatchEvent(new CustomEvent(EVENTS.OPEN_MODAL, {
                detail: {
                  type: MODALS.ERROR,
                  data: {
                    message: i18n(appStore.languageDict, errorKey),
                  },
                },
              }));

              return;
            }
          }
          if (location.pathname.startsWith('/:x:/')) {
            // refresh excel with preview param
            window.sessionStorage.setItem('hlx-sk-preview', JSON.stringify({
              previewPath: status.webPath,
              previewTimestamp: Date.now(),
            }));
            window.location.reload();
          } else {
            appStore.updatePreview();
          }
        },
        isEnabled: (sidekick) => sidekick.isAuthorized('preview', 'write')
          && sidekick.status.webPath,
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
            if (status.webPath === previewPath && appStore.isAuthorized('preview', 'write')) {
              // update preview and remove preview request from session storage
              appStore.updatePreview();
            } else {
              appStore.hideWait();
            }
          }, { once: true });
        }
      },
    };
  }

  /**
   * Creates a publish plugin
   * @param {AppStore} appStore
   * @returns {_Plugin} The publish plugin
   */
  function createPublishPlugin(appStore) {
    return {
      id: 'publish',
      condition: (store) => store.isProject() && store.isContent(),
      button: {
        text: i18n(appStore.languageDict, 'publish'),
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
                  message: i18n(appStore.languageDict, 'publish_failure'),
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

  return {
    createEditPlugin,
    createEnvPlugin,
    createPreviewPlugin,
    createPublishPlugin,
  };
})();
