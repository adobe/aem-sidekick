/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { observable } from 'mobx';
import { log } from '../../log.js';
import { MODALS, STATE } from '../constants.js';

/**
 * @typedef {import('./app.js').AppStore} AppStore
 */

/**
 * @typedef {import('@Types').BulkResource} BulkResource
 */

/**
 * @typedef {import('@Types').BulkSelection} BulkSelection
 */

/**
 * @typedef {import('@Types').BulkSummary} BulkSummary
 */

/**
 * @typedef {import('@Types').AdminJob} AdminJob
 */

/**
 * @typedef {import('@Types').AdminJobProgress} AdminJobProgress
 */

/**
 * @typedef {import('@Types').AdminJobResource} AdminJobResource
 */

/**
 * The path prefix for illegal file names.
 * @type {string}
 */
const illegalPathPrefix = '!ILLEGAL!_';

/**
 * The file types in Google Drive. IDs represent the last 4 characters
 * of first path in the corresponding SVG icons.
 * @type {Object<string, string>}
 */
const gdriveFileTypes = {
  folder: '2-2z',
  sharedFolder: '2v1z',
  gdoc: '777z',
  gsheet: '778z',
  word: '888z',
  excel: '444z',
  image: '1-4z',
  pdf: '666z',
  video: '3.2z',
};

/**
 * Handles bulk operations.
 */
export class BulkStore {
  /**
   * The bulk selection
   * @type {BulkSelection}
   */
  @observable accessor selection = [];

  /**
   * The bulk progress
   * @type {AdminJobProgress}
   */
  @observable accessor progress = null;

  /**
   * @type {AppStore}
   */
  appStore;

  /**
   * @type {BulkSummary}
   */
  summary;

  /**
   * Validates a bulk resource.
   * @param {BulkResource} item The bulk resource
   * @returns {BulkResource} The validated bulk resource
   */
  #validateBulkResource(item) {
    // detect illegal characters in file name
    const { file, type } = item;
    if (['/', '*', '\\', '!', '?'].find((char) => file.includes(char))) {
      return {
        type,
        file: `${illegalPathPrefix}${file}`,
      };
    }

    return {
      type,
      file,
    };
  }

  /**
   * Normalizes a file name.
   * @param {string} file The file name
   * @returns {string} The sanitized file name
   */
  #normalize(file) {
    return file
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Extracts selected files from the Sharepoint DOM.
   * @param {Document} document The document
   * @returns {BulkSelection} The selection
   */
  #getSharepointBulkSelection(document) {
    return [...document.querySelectorAll('#appRoot [role="presentation"] div[aria-selected="true"]')]
      // exclude folders
      .filter((row) => !row.querySelector('img')?.getAttribute('src').includes('/foldericons/')
        && !row.querySelector('img')?.getAttribute('src').endsWith('folder.svg')
        && !row.querySelector('svg')?.parentElement.className.toLowerCase().includes('folder'))
      // extract file name and type
      .map((row) => {
        const info = row.getAttribute('aria-label') || row.querySelector('span')?.textContent;
        // info format: bla.docx, docx File, Private, Modified 8/28/2023, edited by Jane, 1 KB
        const type = info.match(/, ([a-z0-9]+) [A-Za-z]+,/)?.[1];
        const file = type && info.split(`, ${type}`)[0];
        return {
          file,
          type,
        };
      })
      // remove empty entries
      .filter(({ type, file }) => file && type)
      // return validated resources
      .map(this.#validateBulkResource);
  }

  /**
   * Extracts selected files from the Google Drive DOM.
   * @param {Document} document The document
   * @returns {BulkSelection} The selection
   */
  #getGoogleDriveBulkSelection(document) {
    return [...document.querySelectorAll('#drive_main_page [role="row"][aria-selected="true"]')]
      // extract file name and type
      .map((row) => {
        // use path in icon svg to determine type
        const typeHint = (row.querySelector(':scope div[role="gridcell"] > div:nth-child(1) path:nth-child(1)') // list layout
          || row.querySelector(':scope div[role="gridcell"] > div:nth-of-type(1) > div:nth-child(2) path:nth-child(1)')) // grid layout
          .getAttribute('d').slice(-4);
        let type = 'unknown';
        if (typeHint) {
          if (typeHint === gdriveFileTypes.folder || typeHint === gdriveFileTypes.sharedFolder) {
            type = 'folder';
          } else if (typeHint === gdriveFileTypes.gdoc || typeHint === gdriveFileTypes.word) {
            type = 'document';
          } else if (typeHint === gdriveFileTypes.gsheet || typeHint === gdriveFileTypes.excel) {
            type = 'spreadsheet';
          } else if ([
            gdriveFileTypes.image,
            gdriveFileTypes.video,
            gdriveFileTypes.pdf,
          ].find((hint) => typeHint.includes(hint))) {
            type = 'media';
          }
        }
        const file = row.querySelector(':scope > div > div:nth-of-type(2)')?.textContent.trim() // list layout
          || (row.querySelector(':scope > div > div > div:nth-of-type(4)') // grid layout (file)
          || row.querySelector(':scope div[role="gridcell"] > div > div:nth-child(4) > div'))?.textContent.trim(); // grid layout (folder)
        return {
          type,
          file,
        };
      })
      // exclude folders and emtpy entries
      .filter(({ type, file }) => type && type !== 'folder' && file)
      // return validated resources
      .map(this.#validateBulkResource);
  }

  /**
   * Scans the DOM for selected items and updates the bulk selection.
   */
  updateBulkSelection() {
    const { location } = this.appStore;
    this.selection = this.appStore.isSharePointFolder(location)
      ? this.#getSharepointBulkSelection(document)
      : this.#getGoogleDriveBulkSelection(document);
  }

  /**
   * Creates a canonical path for each item in a bulk selection,
   * adding or removing the file extension where appropriate.
   * @param {BulkSelection} selection The bulk selection
   * @param {string} folder The parent folder path
   * @returns {string[]} The canonicalized paths
   */
  #bulkSelectionToPath(selection, folder) {
    if (!folder) {
      return [];
    }

    return selection.map((item) => {
      const { file, type } = item;

      let filename = file;
      let ext = '';
      const lastDot = file.lastIndexOf('.');
      if (lastDot > 0) {
        filename = file.substring(0, lastDot);
        ext = file.substring(lastDot);
      }

      if (type === 'docx') {
        // omit docx extension
        ext = '';
      }

      if (type === 'xlsx' || type === 'spreadsheet') {
        // use json extension for spreadsheets
        ext = '.json';
      }

      if (filename === 'index') {
        // folder root
        filename = '';
      }

      return `${folder}${folder.endsWith('/') ? '' : '/'}${this.#normalize(filename)}${ext}`;
    });
  }

  /**
   * Performs a bulk operation.
   * @param {string} operation The bulk operation ("preview" or "publish")
   * @param {Object} [opts] The options
   * @param {string} [opts.route=operation] The route
   * @param {string} [opts.method='POST'] The method
   * @returns {Promise<AdminJob>} The job details
   */
  async #doBulkOperation(operation, {
    route = operation,
  } = {}) {
    const { appStore, selection: bulkSelection } = this;
    const { status, api } = appStore;

    // check for illegal file names
    const illegalNames = bulkSelection
      .filter(({ file }) => file.startsWith(illegalPathPrefix))
      .map(({ file }) => file.substring(10));
    if (illegalNames.length > 0) {
      appStore.showToast(
        appStore.i18n(`bulk_error_illegal_file_name${illegalNames.length === 1 ? '' : 's'}`)
          .replace('$1', illegalNames.join(', ')),
        'warning',
      );
      return null;
    }

    const paths = this.#bulkSelectionToPath(bulkSelection, status.webPath);

    // set initial bulk progress
    this.progress = {
      total: paths.length,
      processed: 0,
      failed: 0,
    };

    const resp = await api.startBulkJob(route, paths);
    if (resp) {
      return new Promise((resolve) => {
        const { job } = resp;
        if (job) {
          const { topic, name } = job;
          // poll job state and resolve when stopped
          const jobStatusPoll = window.setInterval(async () => {
            const jobStatus = await api.getJob(topic, name);
            if (jobStatus) {
              const { state, progress } = jobStatus;
              if (state === 'stopped') {
                // stop polling
                window.clearInterval(jobStatusPoll);
                // delayed reset of bulk progress
                window.setTimeout(() => {
                  this.progress = null;
                }, 1000);
                // return job details
                resolve(api.getJob(topic, name, true));
              } else if (progress) {
                // update bulk progress
                this.progress = progress;
              }
            }
          }, 1000);
        }
      });
    }
    return null;
  }

  /**
   * Creates mock admin job details.
   * @param {string} path The resource path
   * @returns {AdminJob} The job details
   */
  #mockAdminJobDetails(path) {
    return {
      name: 'single',
      state: 'completed',
      startTime: new Date().toUTCString(),
      progress: {
        total: 1,
        processed: 1,
        failed: 0,
      },
      data: {
        resources: [{
          path,
          status: 200,
        }],
      },
    };
  }

  /**
   * Runs a bulk preview operation on the bulk selection.
   * @returns {Promise<AdminJob>} The job details once stopped
   */
  async preview() {
    if (this.selection.length === 0) {
      log.debug('bulk preview: no selection');
      return null;
    }

    const status = await this.appStore.fetchStatus(true, true);

    if (this.selection.length === 1) {
      // single preview
      log.debug('bulk preview: performing single operation');
      const path = this.#bulkSelectionToPath(this.selection, status.webPath)[0];
      const res = await this.appStore.update(path);
      if (res) {
        return this.#mockAdminJobDetails(path);
      }
      return null;
    } else {
      // bulk preview
      log.debug(`bulk preview: performing bulk operation for ${this.selection.length} files`);
      this.appStore.setState(STATE.BULK_PREVIEWING);

      const res = await this.#doBulkOperation('preview');
      if (!res) {
        this.appStore.setState();
      }
      return res;
    }
  }

  /**
   * Runs a bulk publish operation on the bulk selection.
   * @returns {Promise<AdminJob>} The job details once stopped
   */
  async publish() {
    if (this.selection.length === 0) {
      log.debug('bulk publish: no selection');
      return null;
    }

    const status = await this.appStore.fetchStatus(true, true);

    if (this.selection.length === 1) {
      // single publish
      log.debug('bulk publish: performing single operation');
      const path = this.#bulkSelectionToPath(this.selection, status.webPath)[0];
      const res = await this.appStore.publish(path);
      if (res) {
        return this.#mockAdminJobDetails(path);
      }
      return null;
    } else {
      // bulk preview
      log.debug(`bulk publish: performing bulk operation for ${this.selection.length} files`);
      this.appStore.setState(STATE.BULK_PUBLISHING);

      const res = await this.#doBulkOperation('publish', { route: 'live' });
      if (!res) {
        this.appStore.setState();
      }
      return res;
    }
  }

  /**
   * Returns the bulk confirmation text for a given action.
   * @param {string} operation The bulk operation
   * @param {number} total The total number of files
   * @returns {string} The bulk confirmation text
   */
  getConfirmText(operation, total) {
    const suffix = total > 1 ? 'multiple' : 'single';
    return this.appStore.i18n(`bulk_confirm_${operation}_${suffix}`)
      .replace('$1', `${total}`);
  }

  /**
   * Returns the summary text for a bulk operation.
   * @param {string} operation The bulk operation
   * @param {number} total The total number of files
   * @param {number} [failed] The number of failed files
   * @returns {string} The bulk report text
   */
  #getSummaryText(operation, total, failed) {
    const type = total > 1 ? 'multiple' : 'single';
    let outcome = 'success';
    if (total >= 1 && failed === total) {
      // all failed
      outcome = 'failure';
    } else if (total > 1 && failed >= 1 && failed < total) {
      // some failed
      outcome = 'partial_success';
    }
    const i18nKey = `bulk_result_${operation}_${type}_${outcome}`;
    return this.appStore.i18n(i18nKey)
      .replace('$1', `${total - failed}`)
      .replace('$2', `${failed}`);
  }

  /**
   * Displays a toast with the bulk operation summary.
   * @param {string} operation The bulk operation ("preview" or "publish")
   * @param {AdminJobResource[]} resources The resources
   * @param {string} host The host name to use for URLs
   */
  showSummary(operation, resources, host) {
    this.summary = {
      operation,
      resources,
      host,
    };

    const failed = resources.filter(({ status }) => status >= 400);
    const message = this.#getSummaryText(operation, resources.length, failed.length);
    // eslint-disable-next-line no-nested-ternary
    const variant = (failed.length !== resources.length) ? 'positive' : 'negative';

    const urls = resources
      .filter(({ status }) => status < 400)
      .map(({ path }) => `https://${host}${path}`);
    const openUrls = () => urls.forEach((url) => this.appStore.openPage(url));
    // const copyUrls = () => navigator.clipboard.writeText(urls.join('\n'));

    const openLabel = this.appStore.i18n('open');
    const openCallback = () => {
      if (urls.length <= 10) {
        openUrls();
      } else {
        // ask for confirmation if more than 10 URLs
        this.appStore.showModal({
          type: MODALS.CONFIRM,
          data: {
            headline: this.appStore.i18n('open_urls').replace('$1', `${resources.length}`),
            message: this.appStore.i18n('open_urls_confirm').replace('$1', `${resources.length}`),
            confirmLabel: openLabel,
            confirmCallback: openUrls,
          },
        });
      }
    };

    const actionLabel = this.appStore.i18n('bulk_result_details');

    // show bulk details modal
    const actionCallback = () => {
      this.appStore.showModal({
        type: MODALS.BULK_DETAILS,
        data: {
          headline: message,
          confirmLabel: openLabel,
          confirmCallback: openCallback,
        },
      });
      this.appStore.closeToast();
    };

    // show result toast
    this.appStore.showToast(
      message,
      variant,
      () => this.appStore.closeToast(),
      actionCallback,
      actionLabel,
      30000,
      false,
    );
  }

  /**
   * Initializes the bulk store
   * @param {URL} location The current location
   */
  initStore(location) {
    // listen for selection changes
    const listener = () => window.setTimeout(() => this.updateBulkSelection(), 100);
    const rootEl = document.querySelector(
      this.appStore.isSharePointFolder(location) ? '#appRoot' : 'body',
    );
    if (rootEl) {
      rootEl.addEventListener('click', listener);
      rootEl.addEventListener('keyup', listener);
    }
  }

  constructor(appStore) {
    this.appStore = appStore;
  }
}
