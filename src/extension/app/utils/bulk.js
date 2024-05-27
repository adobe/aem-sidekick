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

/**
 * @typedef {import('@Types').BulkSelection} BulkSelection
 */

/**
 * @typedef {import('@AppStore').AppStore} AppStore
 */

/**
 * @typedef {import('@Types').AdminJobDetails} AdminJobDetails
 */

/**
 * The path prefix for illegal file names.
 * @type {string}
 */
export const illegalPathPrefix = '!ILLEGAL!_';

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
 * Extracts selected files from the Sharepoint DOM.
 * @param {Document} document The document
 * @returns {BulkSelection} The selection
 */
export function getSharepointBulkSelection(document) {
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
      const path = type && info.split(`, ${type}`)[0];
      return {
        path,
        type,
      };
    })
    // validate selection
    .filter(({ type, path }) => path && type);
}

/**
 * Extracts selected files from the Google Drive DOM.
 * @param {Document} document The document
 * @returns {BulkSelection} The selection
 */
export function getGoogleDriveBulkSelection(document) {
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
      const path = row.querySelector(':scope > div > div:nth-of-type(2)')?.textContent.trim() // list layout
        || (row.querySelector(':scope > div > div > div:nth-of-type(4)') // grid layout (file)
        || row.querySelector(':scope div[role="gridcell"] > div > div:nth-child(4) > div'))?.textContent.trim(); // grid layout (folder)
      return {
        type,
        path,
      };
    })
    // exclude folders and emtpy paths
    .filter(({ type, path }) => type !== 'folder' && path);
}

/**
 * Validates and normalizes a bulk selection and returns file paths.
 * @param {BulkSelection} selection The selection
 * @param {string} folder The folder path
 * @returns {string[]} The file paths
 */
export function validateBulkSelection(selection, folder) {
  return selection.map((item) => {
    // detect illegal characters in file name
    const { path, type } = item;
    if (['/', '*', '\\', '!', '?'].find((pattern) => path.includes(pattern))) {
      return `${illegalPathPrefix}${path}`;
    }

    let file = path;
    let ext = '';
    const lastDot = path.lastIndexOf('.');
    if (lastDot > 0) {
      // cut off extension
      file = path.substring(0, lastDot);
      ext = path.substring(lastDot + 1);
    }

    if (this.isSharePointFolder(this.location) && type === 'docx') {
      // omit docx extension on sharepoint
      ext = '';
    }

    if (type === 'xlsx' || type === 'spreadsheet') {
      // use json extension for spreadsheets
      ext = '.json';
    }

    if (file === 'index') {
      // folder root
      file = '';
    }

    // normalize file name
    file = file
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    return `${folder}${folder.endsWith('/') ? '' : '/'}${file}${ext}`;
  });
}

/**
 * Returns the bulk confirmation text for a given action.
 * @param {AppStore} appStore The app store
 * @param {string} operation The bulk operation
 * @returns {string} The bulk confirmation text
 */
export function getBulkConfirmText(appStore, operation) {
  const total = appStore.selection.length;
  const suffix = total > 1 ? 'multiple' : 'single';
  return appStore.i18n(`bulk_confirm_${operation}_${suffix}`)
    .replace('$1', `${total}`);
}

/**
 * Returns the bulk progress text for a given action.
 * @param {AppStore} appStore The app store
 * @param {string} operation The bulk operation
 * @param {number} num The number of processed files
 * @param {number} total The total number of files
 * @returns {string} The bulk progress text
 */
export function getBulkProgressText(appStore, operation, num, total) {
  return appStore.i18n(`bulk_progress_${operation}`)
    .replace('$1', `${num}`)
    .replace('$2', `${total}`);
}

/**
 * Performs a bulk operation.
 * @param {AppStore} appStore The app store
 * @param {string} operation The bulk operation
 * @param {Object} [opts] The options
 * @param {string} [opts.route=operation] The route
 * @param {string} [opts.method='POST'] The method
 * @returns {Promise<AdminJobDetails>} The job details
 */
export async function doBulkOperation(appStore, operation, {
  route = operation,
  method = 'POST',
} = {}) {
  console.log('doBulkOperation', operation, route, method);
  const paths = await appStore.getBulkSelection();
  if (paths.length === 0) {
    return null;
  }
  return null;
}
