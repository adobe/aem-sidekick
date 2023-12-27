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
/* eslint-disable no-unused-expressions */

import { expect } from '@esm-bundle/chai';
import { setUserAgent } from '@web/test-runner-commands';
import sinon from 'sinon';

import chromeMock from './mocks/chrome.js';
import fetchMock from './mocks/fetch.js';
import {
  isSharePointHost,
  urlCache,
} from '../../src/extension/url-cache.js';
import {
  mockDiscoveryCalls,
} from './fixtures/discover.js';

// @ts-ignore
window.chrome = chromeMock;

// @ts-ignore
window.fetch = fetchMock;

describe('Test url-cache', () => {
  const sandbox = sinon.createSandbox();

  const fetchStub = mockDiscoveryCalls([11, 13, 20], [17]);

  before(async () => {
    await setUserAgent('HeadlessChrome');
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('isSharePointHost', async () => {
    // default sharepoint host
    expect(isSharePointHost(
      'https://foo.sharepoint.com/:w:/r/sites/foo/_layouts/15/Doc.aspx?sourcedoc=%7BBFD9A19C-4A68-4DBF-8641-DA2F1283C895%7D&file=index.docx&action=default&mobileredirect=true',
    )).to.be.true;
    // custom sharepoint host
    expect(isSharePointHost(
      'https://some.custom.host/:w:/r/sites/foo/_layouts/15/Doc.aspx?sourcedoc=%7BBFD9A19C-4A68-4DBF-8641-DA2F1283C895%7D&file=index.docx&action=default&mobileredirect=true',
      [{
        mountpoints: ['https://some.custom.host/sites/bar'],
      }],
    )).to.be.true;
  });

  it('set url', async () => {
    const storageSpy = sandbox.spy(window.chrome.storage.session, 'set');
    // static url without config: 0 calls
    await urlCache.set('https://www.hlx.live/');
    expect(fetchStub.callCount).to.equal(0);
    expect(storageSpy.callCount).to.equal(0);
    // sharepoint: 3 fetchSpy calls, 1 storageSpy call
    await urlCache.set('https://foo.sharepoint.com/:w:/r/sites/foo/_layouts/15/Doc.aspx?sourcedoc=%7BBFD9A19C-4A68-4DBF-8641-DA2F1283C895%7D&file=index.docx&action=default&mobileredirect=true');
    expect(fetchStub.callCount).to.equal(3);
    expect(storageSpy.callCount).to.equal(1);
    // gdrive: 1 fetchSpy call, 1 storageSpy call
    await urlCache.set('https://docs.google.com/document/d/1234567890/edit');
    expect(fetchStub.callCount).to.equal(4);
    expect(storageSpy.callCount).to.equal(2);
    // cache: add new entry: 1 fetchSpy call, 1 storageSpy call
    await urlCache.set('https://docs.google.com/document/d/0987654321/edit');
    expect(fetchStub.callCount).to.equal(5);
    expect(storageSpy.callCount).to.equal(3);
    // cache: reuse existing match: 0 calls
    await urlCache.set('https://docs.google.com/document/d/0987654321/edit');
    expect(fetchStub.callCount).to.equal(5);
    expect(storageSpy.callCount).to.equal(3);
    // cache: refresh expired match: 1 fetchSpy call, 1 storageSpy call
    sandbox.stub(Date, 'now').returns(Date.now() + 7205000); // fast-forward 2 days and 5 seconds
    await urlCache.set('https://docs.google.com/document/d/0987654321/edit');
    expect(fetchStub.callCount).to.equal(6);
    expect(storageSpy.callCount).to.equal(4);
    // static url with config: 0 fetchSpy calls, 1 storageSpy call
    await urlCache.set('https://random.foo.bar/', { owner: 'foo', repo: 'random' });
    expect(fetchStub.callCount).to.equal(6);
    expect(storageSpy.callCount).to.equal(5);
    // update static url with config: 0 fetchSpy calls, 1 storageSpy call
    await urlCache.set('https://random.foo.bar/', { owner: 'bar', repo: 'random' });
    expect(fetchStub.callCount).to.equal(6);
    expect(storageSpy.callCount).to.equal(6);
    // sharepoint root folder: 3 fetchSpy calls, 1 storageSpy call
    await urlCache.set('https://foo.sharepoint.com/sites/foo/Shared%20Documents/Forms/AllItems.aspx?id=%2Fsites%2Ffoo%2FShared%20Documents%2Ffoo&viewid=77cb4d37%2D30e2%2D4762%2D87ef%2D5ad0e1059258&RootFolder=1234');
    expect(fetchStub.callCount).to.equal(9);
    expect(storageSpy.callCount).to.equal(7);
    // error handling (fetch root item fails): 3 fetchSpy calls, 1 storageSpy call
    await urlCache.set('https://foo.sharepoint.com/:w:/r/sites/foo/_layouts/15/Doc.aspx?sourcedoc=%7BBFD9A19C-4A68-4DBF-8641-DA2F1283C895%7D&file=index.docx&action=default&mobileredirect=true');
    expect(fetchStub.callCount).to.equal(12);
    expect(storageSpy.callCount).to.equal(8);
    // error handling (fetch edit info fails): 2 fetchSpy calls, 1 storageSpy call
    await urlCache.set('https://foo.sharepoint.com/:w:/r/sites/foo/_layouts/15/Doc.aspx?sourcedoc=%7BBFD9A19C-4A68-4DBF-8641-DA2F1283C895%7D&file=bla.docx&action=default&mobileredirect=true');
    expect(fetchStub.callCount).to.equal(14);
    expect(storageSpy.callCount).to.equal(9);
    // error handling (empty discovery)
    await urlCache.set('https://foo.sharepoint.com/:w:/r/sites/foo/_layouts/15/Doc.aspx?sourcedoc=%7BBFD9A19C-4A68-4DBF-8641-DA2F1283C895%7D&file=baz.docx&action=default&mobileredirect=true');
    // error handling (discovery fails)
    await urlCache.set('https://foo.sharepoint.com/:w:/r/sites/foo/_layouts/15/Doc.aspx?sourcedoc=%7BBFD9A19C-4A68-4DBF-8641-DA2F1283C895%7D&file=baz.docx&action=default&mobileredirect=true');
  });

  it('get url', async () => {
    const sessionGet = sandbox.spy(chrome.storage.session, 'get');
    // known url
    let results = await urlCache.get('https://foo.sharepoint.com/:w:/r/sites/foo/_layouts/15/Doc.aspx?sourcedoc=%7BBFD9A19C-4A68-4DBF-8641-DA2F1283C895%7D&file=index.docx&action=default&mobileredirect=true');
    expect(results.length).to.equal(1);
    // unknown url
    results = await urlCache.get('https://foo.sharepoint.com/:x:/r/sites/foo/_layouts/15/Doc.aspx?sourcedoc=%7ABFD9A19C-4A68-4DBF-8641-DA2F1283C895%7D&file=index.xlsx&action=default&mobileredirect=true');
    expect(results.length).to.equal(0);
    // static url
    results = await urlCache.get('https://random.foo.bar/');
    expect(results.length).to.equal(1);
    expect(sessionGet.called).to.be.true;
  });
});
