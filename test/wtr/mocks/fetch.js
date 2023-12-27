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

import { readFile } from '@web/test-runner-commands';

const DISCOVER_JSON = [
  { owner: 'foo', repo: 'bar1' },
];

const DRIVE_ITEM_FILE_JSON = {
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

const DRIVE_ITEM_FOLDER_JSON = {
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

const ROOT_ITEM_JSON = {
  webUrl: 'https://foo.sharepoint.com/sites/foo/Shared Documents',
  folder: true,
};

const SINGLE_SHEET_JSON_STRING = await readFile({ path: './fixtures/singlesheet.json' });
const MULTI_SHEET_JSON_STRING = await readFile({ path: './fixtures/multisheet.json' });

let calls = 0;

class ResponseMock {
  constructor(res) {
    this.body = res.body || res || '';
    this.status = res.status || 200;
    this.ok = this.status === 200;
  }

  async json() {
    return JSON.parse(this.body);
  }

  async text() {
    return this.body;
  }
}

export default async function fetchMock(url) {
  if (!url) throw new Error('1 argument required, but only 0 present');
  calls += 1;
  if ([11, 13].includes(calls)) {
    // test error handling
    return new ResponseMock({ body: '', status: 404 });
  }
  const path = new URL(url).pathname;
  if (path.startsWith('/discover')) {
    return new ResponseMock(JSON.stringify(DISCOVER_JSON));
  } else if (path.startsWith('/_api/v2.0/shares/')) {
    if (path.includes('MTA1OTI1OA')) {
      return new ResponseMock(JSON.stringify(DRIVE_ITEM_FOLDER_JSON));
    } else {
      return new ResponseMock(JSON.stringify(DRIVE_ITEM_FILE_JSON));
    }
  } else if (path.startsWith('/_api/v2.0/drives/1234')) {
    return new ResponseMock(JSON.stringify(ROOT_ITEM_JSON));
  } else if (path.endsWith('/singlesheet.json')) {
    return new ResponseMock(SINGLE_SHEET_JSON_STRING);
  } else if (path.endsWith('/multisheet.json')) {
    return new ResponseMock(MULTI_SHEET_JSON_STRING);
  }
  // eslint-disable-next-line no-console
  console.log(`unmocked url, returning empty string for ${url}`);
  return new ResponseMock('');
}
