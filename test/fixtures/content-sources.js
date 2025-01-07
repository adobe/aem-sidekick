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
  gdoc: 'Google Docs',
  gsheet: 'Google Sheets',
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
  docx: 'docx',
  xlsx: 'xlsx',
  unknown: 'unknown',
  pdf: 'pdf',
  image: 'jpg',
  video: 'mp4',
  svg: 'svg',
};

export const DEFAULT_GDRIVE_BULK_SELECTION = [
  { path: '/foo/bar', file: 'bar', type: 'folder' },
  { path: '/foo/index', file: 'index', type: 'gdoc' },
  { path: '/foo/document', file: 'document', type: 'gdoc' },
  { path: '/foo/spreadsheet', file: 'spreadsheet', type: 'gsheet' },
  { path: '/foo/file.pdf', file: 'file.pdf', type: 'pdf' },
  { path: '/foo/image.jpg', file: 'image.jpg', type: 'image' },
  { path: '/foo/video.mp4', file: 'video.mp4', type: 'video' },
  { path: '/foo/icon.svg', file: 'icon.svg', type: 'svg' },
  { path: '/foo/file.txt', file: 'file.txt', type: 'unknown' },
];

export const DEFAULT_SHAREPOINT_BULK_SELECTION = [
  { path: '/foo/bar', file: 'bar', type: 'folder' },
  { path: '/foo/index.docx', file: 'index.docx', type: 'docx' },
  { path: '/foo/document.docx', file: 'document.docx', type: 'docx' },
  { path: '/foo/spreadsheet.xlsx', file: 'spreadsheet.xlsx', type: 'xlsx' },
  { path: '/foo/file.pdf', file: 'file.pdf', type: 'pdf' },
  { path: '/foo/image.jpg', file: 'image.jpg', type: 'image' },
  { path: '/foo/video.mp4', file: 'video.mp4', type: 'video' },
  { path: '/foo/icon.svg', file: 'icon.svg', type: 'svg' },
  { path: '/foo/other', file: 'other', type: 'unknown' },
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
        <i></i>
        <i></i>
        <div>
          <div></div>
          <div>
            <div>
              <svg>
                <g>
                  <path d="M16 0 0 0 0000.${icon}"></path>
                </g>
              </svg>
            </div>
          </div>
          <div></div>
          <div>
            <div>${name}</div>
          </div>
          <div></div>
        </div>
      </div>
    </div>`;
}

/**
 * Generates markup mocking a file in the Google Drive admin view.
 * @param {import('@Types').BulkResource} resource
 * @param {string} viewType The view type: "list" (default) or "grid"
 * @returns {string} The markup for the resource
 */
export function mockGdriveFile({ path, type }, viewType = 'list') {
  if (type === 'folder') {
    return mockGdriveFolder(path.split('/').pop(), viewType);
  }
  const icon = gdriveIcons[type] || '0000';
  const descriptor = gdriveDescriptors[type];
  const filename = path.split('/').pop();

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
            <div>
              <svg><path d="M16 0 0 0 0000.${icon}"></path></svg>
            </div>
            <div></div>
            <div>
              <div jsname="wuLfrd">${filename}</div>
            </div>
        </div>
      </div>
    </div>
    `;
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
  const container = document.createElement('div');
  container.setAttribute('role', 'presentation');
  root.appendChild(container);
  return root;
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

/**
 * Generates markup mocking a file in the SharePoint admin view.
 * @param {import('@Types').BulkResource} resource
 * @param {string} viewType The view type: "list" (default) or "grid"
 * @returns {string} The markup for the resource
 */
export function mockSharePointFile({ path, type }, viewType = 'list', nonLatin = false) {
  if (type === 'folder') {
    return mockSharePointFolder(path.split('/').pop(), viewType);
  }
  const descriptor = spDescriptors[type];
  const filename = path.split('/').pop();

  const fileInfo = nonLatin
    ? `${filename}, ${descriptor} 文件, 专用, 已于 2/6/2023 修改, 编辑者: John Doe, 365 KB`
    : `${filename}, ${descriptor} File, Private, Modified 4/9/2023, edited by John Doe, 356 KB`;

  const result = viewType === 'list' ? `
    <div class="file" id="file-${type}" role="row" aria-selected="false"
      aria-label="${fileInfo}">
      <img src="./icons/${type}.svg">
      <button>${filename}</button>
    </div>` : `
    <div class="file" id="file-${type}" role="row" aria-selected="false">
      <span>${fileInfo}</span>
      <i data-icon-name="svg/${type}_16x1.svg" aria-label="${type}">
        <img src="./icons/${type}.svg">
      </i>
      <div data-automationid="name">${filename}</div>
    </div>`;
  return result;
}
