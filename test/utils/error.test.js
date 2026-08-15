/*
 * Copyright 2026 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/* eslint-disable no-unused-expressions */

import { expect } from '@open-wc/testing';
import { isErrorPage } from '../../src/extension/utils/error.js';

function createDocument(body) {
  return new DOMParser().parseFromString(`<html><body>${body}</body></html>`, 'text/html');
}

/**
 * Creates a minimal location object for the given host.
 * @param {string} host The host
 * @returns {Location} The location
 */
function createLocation(host) {
  return /** @type {Location} */ (/** @type {unknown} */ ({
    host,
    hostname: host.split(':')[0],
  }));
}

const errorBody = '<pre>401 Unauthorized</pre>';
const contentBody = '<main><div></div></main>';

describe('isErrorPage', () => {
  it('detects an error page on project hosts', () => {
    ['aem.page', 'aem.live', 'aem.reviews', 'aem.network'].forEach((domain) => {
      const location = createLocation(`main--site--org.${domain}`);
      expect(isErrorPage(location, createDocument(errorBody)), domain).to.be.true;
    });
  });

  it('detects an error page on localhost', () => {
    expect(isErrorPage(createLocation('localhost:3000'), createDocument(errorBody))).to.be.true;
  });

  it('ignores a content page on project hosts', () => {
    const location = createLocation('main--site--org.aem.network');
    expect(isErrorPage(location, createDocument(contentBody))).to.be.false;
  });

  it('ignores an error page on other hosts', () => {
    const location = createLocation('www.example.com');
    expect(isErrorPage(location, createDocument(errorBody))).to.be.false;
  });
});
