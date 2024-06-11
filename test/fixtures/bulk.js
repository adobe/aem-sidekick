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

import { gdriveFileTypes as gdriveIcons } from '../../src/extension/app/store/bulk.js';

const gdriveDescriptors = {
  folder: 'Google Drive Folder',
  document: 'Google Docs',
  spreadsheet: 'Google Sheets',
  unknown: 'unknown',
  pdf: 'PDF File',
  image: 'JPG Image File',
  video: 'MP4 Video File',
  docx: 'Microsoft Word Document',
  xlsx: 'Microsoft Excel Document',
  svg: 'SVG File',
};

const spDescriptors = {
  folder: 'SharePoint Folder',
  docx: 'docx File',
  xlsx: 'xlsx File',
  unknown: 'unknown',
  pdf: 'pdf File',
  image: 'jpg File ',
  video: 'mp4 File',
  svg: 'svg File',
};

export const DEFAULT_GDRIVE_BULK_SELECTION = [
  { path: '/foo/bar', file: 'bar', type: 'folder' },
  { path: '/foo/document', file: 'document', type: 'document' },
  { path: '/foo/spreadsheet', file: 'document', type: 'spreadsheet' },
  { path: '/foo/file.txt', file: 'file.txt', type: 'unknown' },
  { path: '/foo/file.pdf', file: 'file.pdf', type: 'pdf' },
  { path: '/foo/image.jpg', file: 'image.jpg', type: 'media' },
  { path: '/foo/video.mp4', file: 'video.mp4', type: 'video' },
  { path: '/foo/icon.svg', file: 'icon.svg', type: 'svg' },
  { path: '/foo/document.docx', file: 'document.docx', type: 'docx' },
  { path: '/foo/spreadsheet.xlsx', file: 'spreadsheet.xlsx', type: 'xlsx' },
];

export const DEFAULT_SHAREPOINT_BULK_SELECTION = [
  { path: '/foo/bar', file: 'bar', type: 'folder' },
  { path: '/foo/document.docx', file: 'document.docx', type: 'docx' },
  { path: '/foo/spreadsheet.xlsx', file: 'spreadsheet.xlsx', type: 'xlsx' },
  { path: '/foo/file.txt', file: 'file.txt', type: 'unknown' },
  { path: '/foo/file.pdf', file: 'file.pdf', type: 'pdf' },
  { path: '/foo/image.jpg', file: 'image.jpg', type: 'image' },
  { path: '/foo/video.mp4', file: 'video.mp4', type: 'video' },
  { path: '/foo/icon.svg', file: 'icon.svg', type: 'svg' },
];

/*
 * Google Drive mocks
 */

/**
 * Creates an element mocking the root element in the Google Drive admin view.
 * @returns {HTMLDivElement} The root element
 */
export function mockGdriveRoot() {
  const root = document.createElement('div');
  root.id = 'drive_main_page';
  return root;
}

/**
 * Generates markup mocking a file in the Google Drive admin view.
 * @param {import('@Types').BulkResource} resource
 * @param {string} viewType The view type: "list" (default) or "grid"
 * @returns {string} The markup for the resource
 */
export function mockGdriveFile({ path, type }, viewType = 'list') {
  const icon = gdriveIcons[type];
  const descriptor = gdriveDescriptors[type];
  const filename = path.split('/foo/').pop();

  return viewType === 'list' ? `
    <div class="file" id="file-${type}" role="row" aria-selected="false">
      <div role="gridcell">
        <div>
          <svg><path d="M16 0 0 0 0000.${icon}"></path></svg>
        </div>
        <div>
          <div data-tooltip="${descriptor}: ${filename}" aria-label="${filename} Shared ${descriptor}">${filename}</div>
        </div>
      </div>
    </div>` : `
    <div class="file" id="file-${type}" role="row" aria-selected="false">
      <div role="gridcell" aria-label="${filename} ${descriptor} More info (Option + →)">
        <div>
          <div></div>
          <div>
            <svg><path d="M16 0 0 0 0000.${icon}"></path></svg>
          </div>
          <div></div>
          <div>${filename}</div>
        </div>
        <div></div>
      </div>
    </div>
    `;
}

/**
 * Generates markup mocking a folder in the Google Drive admin view.
 * @param {string} name The folder name
 * @param {string} viewType The view type: "list" (default) or "grid"
 * @returns {string} The markup for the resource
 */
export function mockGdriveFolder(name, viewType = 'list') {
  const icon = gdriveIcons.folder;
  const descriptor = gdriveDescriptors.folder;
  return viewType === 'list' ? `
    <div class="folder" id="folder-${name}" role="row" aria-selected="true">
      <div role="gridcell">
        <div>
          <svg>
            <path d="M16 0 0 0 0000.${icon}"></path>
          </svg>
        </div>
        <div>
          <div data-tooltip="${descriptor}: ${name}" aria-label="${name} Shared ${descriptor}">${name}</div>
        </div>
      </div>
    </div>` : `
    <div class="folder" id="folder-${name}" role="row" aria-selected="true">
      <div role="gridcell" aria-label="${name} ${descriptor}">
        <div>
          <div></div>
          <div>
            <svg>
              <path d="M16 0 0 0 0000.${icon}"></path>
            </svg>
          </div>
          <div></div>
          <div>
            <div>${name}</div>
          </div>
        </div>
      </div>
    </div>`;
}

/*
 * SharePoint mocks
 */

/**
 * Creates an element mocking the root element in the SharePoint admin view.
 * @returns {HTMLDivElement} The root element
 */
export function mockSharePointRoot() {
  const root = document.createElement('div');
  root.id = 'appRoot';
  return root;
}

/**
 * Generates markup mocking a file in the SharePoint admin view.
 * @param {import('@Types').BulkResource} resource
 * @param {string} viewType The view type: "list" (default) or "grid"
 * @returns {string} The markup for the resource
 */
export function mockSharePointFile({ path, type }, viewType = 'list') {
  const descriptor = spDescriptors[type];
  const filename = path.split('/foo/').pop();

  return viewType === 'list' ? `
    <div class="file" id="file-${type}" role="row" aria-selected="false" aria-label="${filename}, ${descriptor}, Private">
      <img src="./icons/${type}.svg">
      <button>${filename}</button>
    </div>` : `
    <div class="file" id="file-${type}" role="row" aria-selected="false">
      <span>${filename}, ${descriptor}, Private</span>
      <i data-icon-name="svg/${type}_16x1.svg" aria-label="${type}">
        <img src="./icons/${type}.svg">
      </i>
      <div data-automationid="name">${filename}</div>
    </div>`;
}

/**
 * Generates markup mocking a folder in the SharePoint admin view.
 * @param {string} name
 * @param {string} viewType The view type: "list" (default) or "grid"
 * @returns {string} The markup for the resource
 */
export function mockSharePointFolder(name, viewType = 'list') {
  return viewType === 'list' ? `
    <div class="folder" id="folder-${name}" role="row" aria-selected="true">
      <i class="sourceIcon_05322ca8 coloredFolderIcon_a6bc16ee">
        <svg></svg>
      </i>
      <button>${name}</button>
    </div>` : `
    <div class="folder" id="folder=${name}" role="row" aria-selected="true">
      <i data-icon-name="svg/folder_16x1.svg" aria-label="folder">
        <img src="./icons/foldericons/folder.svg">
      </i>
      <div data-automationid="name">${name}</div>
    </div>`;
}
