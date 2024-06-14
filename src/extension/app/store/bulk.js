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

import { action, observable } from 'mobx';
import { log } from '../../log.js';
import {
  EXTERNAL_EVENTS,
  MODALS,
  MODAL_EVENTS,
  STATE,
} from '../constants.js';

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
export const gdriveFileTypes = {
  folder: '2-2z',
  sharedFolder: '2v1z',
  gdoc: '777z',
  gsheet: '778z',
  word: '888z',
  excel: '444z',
  image: '1-4z',
  svg: '1-4z',
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

  @action
  setSelection(selection) {
    this.selection = selection;
  }

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
        const file = (row.querySelector(':scope div[role="gridcell"] > div > div:nth-child(4)') // grid layout
          || row.querySelector(':scope div[role="gridcell"] > div:nth-of-type(2)')) // list layout
          ?.textContent.trim();

        // use path in icon svg to determine type
        const typeHint = row.querySelector(':scope div[role="gridcell"] > div path') // list & grid layout
          ?.getAttribute('d').slice(-4);
        let type = 'unknown';
        if (typeHint) {
          if (typeHint === gdriveFileTypes.folder || typeHint === gdriveFileTypes.sharedFolder) {
            type = 'folder';
          } else if (typeHint === gdriveFileTypes.gdoc || typeHint === gdriveFileTypes.word) {
            type = 'document';
          } else if (typeHint === gdriveFileTypes.gsheet || typeHint === gdriveFileTypes.excel) {
            type = 'spreadsheet';
          } else if (typeHint === gdriveFileTypes.image && file.toLowerCase().endsWith('.svg')) {
            type = 'svg';
          } else if ([
            gdriveFileTypes.image,
            gdriveFileTypes.video,
            gdriveFileTypes.pdf,
          ].find((hint) => typeHint.includes(hint))) {
            type = 'media';
          }
        }
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
  #updateBulkSelection() {
    const { location } = this.appStore;
    this.setSelection(this.appStore.isSharePointFolder(location)
      ? this.#getSharepointBulkSelection(document)
      : this.#getGoogleDriveBulkSelection(document));
  }

  /**
   * Creates a canonical path for each item in a bulk selection,
   * adding or removing the file extension where appropriate.
   * @private
   * @param {BulkSelection} selection The bulk selection
   * @param {string} folder The parent folder path
   * @returns {string[]} The canonicalized paths
   */
  bulkSelectionToPath(selection, folder) {
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

    const paths = this.bulkSelectionToPath(bulkSelection, status.webPath);

    // set initial bulk progress
    this.progress = {
      total: paths.length,
      processed: 0,
      failed: 0,
    };

    const resp = await api.startJob(route, paths);
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
            } else {
              // stop polling
              window.clearInterval(jobStatusPoll);
              // reset bulk progress
              this.progress = null;
              // return null
              resolve(null);
            }
          }, 1000);
        }
      });
    }
    return null;
  }

  /**
   * Returns the bulk confirmation text for a given action.
   * @private
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
   * @returns {string} The summary text
   */
  getSummaryText(operation, total, failed) {
    const type = total > 1 ? 'multiple' : 'single';
    let outcome = 'success';
    if (total >= 1 && failed === total) {
      // all failed
      outcome = 'failure';
    } else if (total > 1 && failed >= 1 && failed < total) {
      // some failed
      const succeeded = total - failed;
      outcome = `partial_success${succeeded === 1 ? '_1' : ''}`;
    }
    const i18nKey = `bulk_result_${operation}_${type}_${outcome}`;
    return this.appStore.i18n(i18nKey)
      .replace('$1', `${total - failed}`)
      .replace('$2', `${failed}`);
  }

  /**
   * Returns the summary variant for a bulk operation.
   * @private
   * @param {number} total The total number of files
   * @param {number} [failed] The number of failed files
   * @returns {string} The summary variant
   */
  getSummaryVariant(total, failed) {
    if (failed > 0) {
      if (total >= 1 && failed === total) {
        // all failed
        return 'negative';
      } else if (total > 1 && failed >= 1 && failed < total) {
        // some failed
        return 'warning';
      }
    }
    return 'positive';
  }

  /**
   * Displays a toast with the bulk operation summary.
   * @param {string} operation The bulk operation ("preview" or "publish")
   * @param {AdminJobResource[]} resources The resources
   * @param {string} host The host name to use for URLs
   */
  #showSummary(operation, resources, host) {
    this.summary = {
      operation,
      resources,
      host,
    };

    const failed = resources.filter(({ status }) => status >= 400);
    const succeeded = resources.filter(({ status }) => status < 400);
    const paths = succeeded.map(({ path }) => path);

    const message = this.getSummaryText(operation, resources.length, failed.length);
    const variant = this.getSummaryVariant(resources.length, failed.length);

    const openUrlsLabel = this.appStore.i18n(`open_url${paths.length !== 1 ? 's' : ''}`)
      .replace('$1', `${paths.length}`);
    const openUrlsCallback = () => this.openUrls(host, paths);

    const copyUrlsLabel = this.appStore.i18n(`copy_url${paths.length !== 1 ? 's' : ''}`)
      .replace('$1', `${paths.length}`);
    const copyUrlsCallback = () => this.copyUrls(host, paths);

    if (failed.length === 0) {
      // show success toast with open and copy buttons
      this.appStore.showToast(
        message,
        variant,
        null,
        openUrlsCallback,
        openUrlsLabel,
        copyUrlsCallback,
        copyUrlsLabel,
        6000,
        false,
      );
    } else {
      // show (partial) failure toast with details button
      this.appStore.showToast(
        message,
        variant,
        null,
        () => {
          this.appStore.showModal({
            type: MODALS.BULK,
          });
          this.appStore.closeToast();
        },
        this.appStore.i18n('bulk_result_details'),
        null, // no secondary callback
        null, // no secondary label
        60000,
        false,
      );
    }
  }

  /**
   * Validates the selection before performing a bulk operation.
   * @param {string} operation The bulk operation ("preview" or "publish")
   * @returns {boolean} True if selection is valid, else false
   */
  #validateSelection(operation) {
    if (this.selection.length === 0) {
      log.debug(`bulk ${operation}: no selection`);
      return false;
    }

    const illegalNames = this.selection
      .filter(({ file }) => file.startsWith(illegalPathPrefix))
      .map(({ file }) => file.substring(10));
    if (illegalNames.length > 0) {
      this.appStore.showToast(
        this.appStore.i18n(`bulk_error_illegal_file_name${illegalNames.length === 1 ? '' : 's'}`)
          .replace('$1', illegalNames.join(', ')),
        'warning',
      );
      return false;
    }
    return true;
  }

  /**
   * Runs a bulk preview operation on the bulk selection.
   */
  async preview() {
    if (!this.#validateSelection('preview')) {
      return;
    }

    const modal = this.appStore.showModal({
      type: 'confirm',
      data: {
        headline: this.appStore.i18n('preview'),
        message: this.getConfirmText('preview', this.selection.length),
        confirmLabel: this.appStore.i18n('preview'),
      },
    });

    modal.addEventListener(MODAL_EVENTS.CONFIRM, async () => {
      const status = await this.appStore.fetchStatus(true, true);
      const host = this.appStore.siteStore.innerHost;
      let resources = null;

      if (this.selection.length === 1) {
        // single preview
        log.debug('bulk preview: performing single operation');
        const path = this.bulkSelectionToPath(this.selection, status.webPath)[0];
        const res = await this.appStore.update(path);
        if (res) {
          resources = [{
            path,
            status: 200,
          }];
        } else {
          this.appStore.setState();
        }
      } else {
        // bulk preview
        log.debug(`bulk preview: performing bulk operation for ${this.selection.length} files`);
        this.appStore.setState(STATE.BULK_PREVIEWING);

        const res = await this.#doBulkOperation('preview');
        if (res) {
          ({ resources } = res.data || {});
          this.appStore.fireEvent(
            EXTERNAL_EVENTS.RESOURCE_PREVIEWED,
            resources.map(({ path }) => path),
          );
        } else {
          this.appStore.setState();
        }
      }
      if (resources) {
        this.#showSummary('preview', resources, host);
      }
    }, { once: true });
  }

  /**
   * Runs a bulk publish operation on the bulk selection.
   */
  async publish() {
    if (!this.#validateSelection('preview')) {
      return;
    }

    const modal = this.appStore.showModal({
      type: 'confirm',
      data: {
        headline: this.appStore.i18n('publish'),
        message: this.getConfirmText('publish', this.selection.length),
        confirmLabel: this.appStore.i18n('publish'),
      },
    });

    modal.addEventListener(MODAL_EVENTS.CONFIRM, async () => {
      const status = await this.appStore.fetchStatus(true, true);
      const host = this.appStore.siteStore.host || this.appStore.siteStore.outerHost;
      let resources = null;

      if (this.selection.length === 1) {
        // single publish
        log.debug('bulk publish: performing single operation');
        const path = this.bulkSelectionToPath(this.selection, status.webPath)[0];
        const res = await this.appStore.publish(path);
        if (res) {
          resources = [{
            path,
            status: 200,
          }];
        } else {
          this.appStore.setState();
        }
      } else {
        // bulk preview
        log.debug(`bulk publish: performing bulk operation for ${this.selection.length} files`);
        this.appStore.setState(STATE.BULK_PUBLISHING);

        const res = await this.#doBulkOperation('publish', { route: 'live' });
        if (res) {
          ({ resources } = res.data || {});
          this.appStore.fireEvent(
            EXTERNAL_EVENTS.RESOURCE_PUBLISHED,
            resources.map(({ path }) => path),
          );
        } else {
          this.appStore.setState();
        }
      }
      if (resources) {
        this.#showSummary('publish', resources, host);
      }
    });
  }

  /**
   * Creates URLs from paths and copies URLs to the clipboard.
   * @param {string} [host] The host name (default: preview host)
   * @param {string[]} [paths] The paths to use (default: paths created from selection)
   */
  async copyUrls(host, paths) {
    host = host || this.appStore.siteStore.innerHost;
    if (!paths) {
      if (!this.#validateSelection('copyUrls')) {
        return;
      }
      const status = await this.appStore.fetchStatus(true, true);
      paths = this.bulkSelectionToPath(this.selection, status.webPath);
    }

    navigator.clipboard.writeText(
      paths.map((path) => `https://${host}${path}`).join('\n'),
    );

    this.appStore.showToast(
      this.appStore.i18n(`copied_url${paths.length !== 1 ? 's' : ''}`),
      'positive',
    );
  }

  /**
   * Creates URLs from paths and opens them in new browser windows.
   * @param {string} [host] The host name (default: preview host)
   * @param {string[]} [paths] The paths to use (default: paths created from selection)
   */
  async openUrls(host, paths) {
    host = host || this.appStore.siteStore.innerHost;
    if (!paths) {
      if (!this.#validateSelection('openUrls')) {
        return;
      }
      const status = await this.appStore.fetchStatus(true, true);
      paths = this.bulkSelectionToPath(this.selection, status.webPath);
    }

    const urls = paths.map((path) => `https://${host}${path}`);
    if (urls.length <= 10) {
      urls.forEach((url) => this.appStore.openPage(url));
    } else {
      const openUrlsLabel = this.appStore.i18n(`open_url${urls.length !== 1 ? 's' : ''}`)
        .replace('$1', `${urls.length}`);
      this.appStore.showModal({
        type: MODALS.CONFIRM,
        data: {
          headline: openUrlsLabel,
          message: this.appStore.i18n('open_urls_confirm').replace('$1', `${urls.length}`),
          confirmLabel: openUrlsLabel,
          confirmCallback: () => urls.forEach((url) => this.appStore.openPage(url)),
        },
      });
    }
  }

  /**
   * Initializes the bulk store
   * @param {URL} location The current location
   */
  initStore(location) {
    this.#updateBulkSelection();
    // listen for selection changes
    const listener = () => window.setTimeout(() => this.#updateBulkSelection(), 100);
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
