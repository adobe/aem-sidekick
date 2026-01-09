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
  { path: '/foo/other.unknown', file: 'other.unknown', type: 'unknown' },
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
  root.setAttribute('role', 'main');
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
  return viewType === 'list' ? `
    <tr class="folder" id="folder-${name}" role="row" aria-selected="true">
      <td>
        <div>
          <div>
            <div>
              <div>
                <div>
                  <div>
                    <svg><path d="M16 0 0 0 0000.${icon}"></path></svg>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div>
                <div data-id>
                  <span>
                    <strong>${name}</strong>
                  </span>
                </div>
                <div role="button" tabindex="-1" data-tooltip-delay="0" data-tooltip="Catch me up" aria-label="Catch me up">
                  <span class="cS0c5e">Catch me up</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </td>
    </tr>
    ` : `
    <div class="folder" id="file-${name}" role="gridcell" aria-selected="true">
      <div>
        <div></div>
        <div>
          <div>
            <div>
              <div>
                <div>
                  <svg><path d="M16 0 0 0 0000.${icon}"></path></svg>
                </div>
              </div>
            </div>
          </div>
          <div>
            <div>${name}</div>
            <div role="button" tabindex="-1" data-tooltip-delay="0" data-tooltip="Catch me up" aria-label="Catch me up">
              <span class="cS0c5e">Catch me up</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    `;
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
  const filename = path.split('/').pop();
  return viewType === 'list' ? `
    <tr class="file" id="file-${type}" role="row" aria-selected="false">
      <td>
        <div>
          <div>
            <div>
              <div>
                <div>
                  <div>
                    <svg><path d="M16 0 0 0 0000.${icon}"></path></svg>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div>
                <div data-id>
                  <span>
                    <strong>${filename}</strong>
                  </span>
                </div>
                <div role="button" tabindex="-1" data-tooltip-delay="0" data-tooltip="Catch me up" aria-label="Catch me up">
                  <span class="cS0c5e">Catch me up</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </td>
    </tr>
    ` : `
    <div class="file" id="file-${type}" role="gridcell" aria-selected="false">
      <div>
        <div></div>
        <div>
          <div>
            <div>
              <div>
                <div>
                  <svg><path d="M16 0 0 0 0000.${icon}"></path></svg>
                </div>
              </div>
            </div>
          </div>
          <div>
            <div>${filename}</div>
            <div role="button" tabindex="-1" data-tooltip-delay="0" data-tooltip="Catch me up" aria-label="Catch me up">
              <span class="cS0c5e">Catch me up</span>
            </div>
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
export function mockSharePointFile({ path, type }, viewType = 'list') {
  if (type === 'folder') {
    return mockSharePointFolder(path.split('/').pop(), viewType);
  }
  const filename = path.split('/').pop();

  const result = viewType === 'list' ? `
    <div class="file" id="file-${type}" role="row" aria-selected="false">
      <span role="button" data-id="heroField">${filename}</span>
    </div>` : `
    <div class="file" id="file-${type}" role="row" aria-selected="false">
      <div data-automationid="name">${filename}</div>
    </div>`;
  return result;
}
