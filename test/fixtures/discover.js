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

export const DISCOVER_JSON = [
  { org: 'foo', site: 'bar1', originalSite: true },
  { org: 'foo', site: 'bar2', originalSite: false },
];

export const DRIVE_ITEM_FILE_JSON = {
  webUrl: 'https://foo.sharepoint.com/:w:/r/sites/foo/_layouts/15/Doc.aspx?sourcedoc=%7BBFD9A19C',
  parentReference: {
    driveId: '1234',
    itemId: 'foobar',
    path: '1234/root:/products',
  },
  name: 'index.docx',
  file: {
    mimeType: 'word',
  },
};

export const DRIVE_ITEM_FOLDER_JSON = {
  webUrl: 'https://foo.sharepoint.com/sites/foo/Shared%20Documents/Forms/AllItems.aspx?id=%2Fsites%2Ffoo%2FShared%20Documents%2Ffoo',
  parentReference: {
    driveId: '1234',
    itemId: 'foobar',
    path: '1234/root:/products',
  },
  name: '/',
  folder: {
    childCount: 10,
  },
};

export const ROOT_ITEM_JSON = {
  webUrl: 'https://foo.sharepoint.com/sites/foo/Shared Documents',
  folder: true,
};
