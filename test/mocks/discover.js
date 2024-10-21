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

// @ts-ignore
import fetchMock from 'fetch-mock/esm/client.js';
import {
  DISCOVER_JSON,
  DISCOVER_JSON_MULTIPLE,
  DRIVE_ITEM_FILE_JSON,
  DRIVE_ITEM_FOLDER_JSON,
  ROOT_ITEM_JSON,
} from '../fixtures/discover.js';

/**
 * Mocks fetch requests related to URL discovery.
 * @param {object} [cfg] The config object
 * @param {boolean} [cfg.fail] Whether to fail the request
 * @param {boolean} [cfg.empty] Whether to return an empty response
 * @param {boolean} [cfg.multipleOriginalSites] Whether to return multiple original sites
 * @returns {Object} The stubbed fetch function
 */
export function mockDiscoveryCall({
  fail = false,
  empty = false,
  multipleOriginalSites = false,
} = {}) {
  fetchMock.restore();
  fetchMock.get('begin:https://admin.hlx.page/discover/', (url) => {
    if (fail) {
      return new Response('', { status: 404 });
    }
    // @ts-ignore
    const path = new URL(url).pathname;
    if (path.startsWith('/discover')) {
      if (empty) {
        return new Response('[]');
      } else if (multipleOriginalSites) {
        return new Response(JSON.stringify(DISCOVER_JSON_MULTIPLE));
      } else {
        return new Response(JSON.stringify(DISCOVER_JSON));
      }
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
}
