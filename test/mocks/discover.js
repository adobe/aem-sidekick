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

import sinon from 'sinon';
import {
  DISCOVER_JSON, DRIVE_ITEM_FILE_JSON, DRIVE_ITEM_FOLDER_JSON, ROOT_ITEM_JSON,
} from '../fixtures/discover.js';

let count;

/**
 * Mocks fetch requests related to URL discovery.
 * @param {number[]} fail The numbers of calls to let fail
 * @param {number[]} empty The numbers of calls where discovery should come up emtpy
 * @returns {Object} The stubbed fetch function
 */
export function mockDiscoveryCalls(fail = [], empty = []) {
  count = 0;
  const stub = sinon.stub(window, 'fetch')
    .callsFake(async (url) => {
      count += 1;
      if (fail.includes(count)) {
        return new Response('', { status: 404 });
      }
      // @ts-ignore
      const path = new URL(url).pathname;
      if (path.startsWith('/discover')) {
        return new Response(empty.includes(count) ? '[]' : JSON.stringify(DISCOVER_JSON));
      } else if (path.startsWith('/_api/v2.0/shares/')) {
        if (path.includes('MTA1OTI1OA')) {
          return new Response(JSON.stringify(DRIVE_ITEM_FOLDER_JSON));
        } else {
          return new Response(JSON.stringify(DRIVE_ITEM_FILE_JSON));
        }
      } else if (path.startsWith('/_api/v2.0/drives/1234')) {
        return new Response(JSON.stringify(ROOT_ITEM_JSON));
      }
      return new Response('');
    });
  return stub;
}
