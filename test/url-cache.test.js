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

import { expect } from '@open-wc/testing';
import { setUserAgent } from '@web/test-runner-commands';
import sinon from 'sinon';

import chromeMock from './mocks/chrome.js';
import {
  isSharePointHost,
  isPersonalOneDriveFolder,
  urlCache,
} from '../src/extension/url-cache.js';
import {
  mockDiscoveryCall,
} from './mocks/discover.js';
import { error, mockTab } from './test-utils.js';

// @ts-ignore
window.chrome = chromeMock;

describe('Test url-cache', () => {
  const sandbox = sinon.createSandbox();

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
    // excluded host: .da.live
    expect(isSharePointHost(
      'https://content.da.live/foo/bar',
      [{ mountpoints: ['https://content.da.live/foo/bar'] }],
    )).to.be.false;
    // excluded host: .google.com
    expect(isSharePointHost(
      'https://drive.google.com/drive/folders/1234567890',
      [{ mountpoints: ['https://drive.google.com/drive/folders/1234567890'] }],
    )).to.be.false;
    // excluded host: .adobeaemcloud.com
    expect(isSharePointHost(
      'https://author-p00000-e00000.adobeaemcloud.com/content/site',
      [{ mountpoints: ['https://author-p00000-e00000.adobeaemcloud.com/content/site'] }],
    )).to.be.false;
    // excluded host: .adobecqms.net
    expect(isSharePointHost(
      'https://author-stage.adobecqms.net/content/site',
      [{ mountpoints: ['https://author-stage.adobecqms.net/content/site'] }],
    )).to.be.false;
    // excluded host: .adobeio-static.net
    expect(isSharePointHost(
      'https://test.adobeio-static.net/assets/content/site',
      [{ mountpoints: ['https://test.adobeio-static.net/assets/content/site'] }],
    )).to.be.false;
    // excluded host: .adobeioruntime.net
    expect(isSharePointHost(
      'https://test.adobeioruntime.net/content/site',
      [{ mountpoints: ['https://test.adobeioruntime.net/content/site'] }],
    )).to.be.false;
  });

  it('isPersonalOneDriveFolder', async () => {
    // sharepoint folder
    expect(isPersonalOneDriveFolder(
      'https://acme.sharepoint.com/sites/ACME/Shared%20Documents/Forms/AllItems.aspx?id=%2Fsites%2FACME%2FShared%20Documents%2Ffoo&viewid=07cb4d37%2D3ae2%2D4762%2D87ef%2D5ad0e1059258',
    )).to.be.false;
    // personal onedrive folders
    expect(isPersonalOneDriveFolder(
      'https://acme-my.sharepoint.com/personal/someone_acme_com/_layouts/15/onedrive.aspx?id=%2Fpersonal%2Fsomeone_acme_com2FDocuments&view=0',
    )).to.be.true;
    expect(isPersonalOneDriveFolder(
      'https://acme-my.sharepoint.com/:f:/r/personal/someone_acme_com/Documents/ACME',
    )).to.be.true;
    expect(isPersonalOneDriveFolder(
      'https://acme-my.sharepoint.com/:f:/p/someone/EoYJVIqcrKFHu1NVLXhq9c8BZx8zwWqfEtGZ1otwW9W0mQ?e=kuqPBr',
    )).to.be.true;
  });

  describe('set', () => {
    let fetchMock;
    let sessionSet;
    let sendMessage;

    let onMessageListener;
    beforeEach(() => {
      fetchMock = mockDiscoveryCall();
      sessionSet = sandbox.spy(window.chrome.storage.session, 'set');
      sandbox.stub(window.chrome.runtime.onMessage, 'addListener').callsFake((listener) => {
        expect(listener).to.be.a('function');
        onMessageListener = listener;
      });
      // @ts-ignore
      sendMessage = sandbox.stub(window.chrome.runtime, 'sendMessage').callsFake((message) => {
        expect(onMessageListener).to.be.a('function');
        expect(message).to.be.an('object');
        onMessageListener(message, { tab: { id: 0 } });
      });
    });

    afterEach(() => {
      fetchMock.restore();
    });

    it('static url without config', async () => {
      await urlCache.set(mockTab('https://www.hlx.live/'));
      expect(fetchMock.calls().length).to.equal(0);
      expect(sessionSet.callCount).to.equal(0);
    });

    it('sharepoint url', async () => {
      await urlCache.set(mockTab('https://foo.sharepoint.com/:w:/r/sites/foo/_layouts/15/Doc.aspx?sourcedoc=%7BBFD9A19C-4A68-4DBF-8641-DA2F1283C895%7D&file=index.docx&action=default&mobileredirect=true'));
      expect(fetchMock.calls().length).to.equal(3);
      expect(sessionSet.callCount).to.equal(1);
    }).timeout(5000);

    it('gdrive url', async () => {
      await urlCache.set(mockTab('https://docs.google.com/document/d/1234567890/edit'));
      expect(fetchMock.calls().length).to.equal(1);
      expect(sessionSet.callCount).to.equal(1);
    });

    it('add new entry', async () => {
      await urlCache.set(mockTab('https://docs.google.com/document/d/0987654321/edit'));
      expect(fetchMock.calls().length).to.equal(1);
      expect(sessionSet.callCount).to.equal(1);
    });

    it('reuse existing match', async () => {
      await urlCache.set(mockTab('https://docs.google.com/document/d/0987654321/edit'));
      expect(fetchMock.calls().length).to.equal(0);
      expect(sessionSet.callCount).to.equal(0);
    });

    it('refresh expired match', async () => {
      sandbox.stub(Date, 'now').returns(Date.now() + 7205000); // fast-forward 2 days and 5 seconds
      await urlCache.set(mockTab('https://docs.google.com/document/d/0987654321/edit'));
      expect(fetchMock.calls().length).to.equal(1);
      expect(sessionSet.callCount).to.equal(1);
    });

    it('static url with config', async () => {
      await urlCache.set(mockTab('https://random.foo.bar/'), { owner: 'foo', repo: 'random' });
      expect(fetchMock.calls().length).to.equal(0);
      expect(sessionSet.callCount).to.equal(1);
    });

    it('update static url with config', async () => {
      await urlCache.set(mockTab('https://random.foo.bar/'), { owner: 'bar', repo: 'random' });
      expect(fetchMock.calls().length).to.equal(0);
      expect(sessionSet.callCount).to.equal(1);
    });

    it('include config hints for gdrive url', async () => {
      const configs = [
        { owner: 'foo', repo: 'random', mountpoints: ['https://drive.google.com/drive/folders/1234567890'] },
        { owner: 'bar', repo: 'random', mountpoints: ['https://drive.google.com/drive/folders/0987654321'] },
      ];

      // gdrive url
      await urlCache.set(
        mockTab('https://docs.google.com/document/d/2468101214/edit'),
        configs,
      );
      expect(new URL(fetchMock.calls().pop()[0]).searchParams.getAll('hint')).to.deep.equal(['foo/random', 'bar/random']);

      // non-gdrive url
      await urlCache.set(
        mockTab('https://foo.sharepoint.com/:w:/r/sites/foo/_layouts/15/Doc.aspx?sourcedoc=%7BBFD9A19C-4A68-4DBF-8641-DA2F1283C896%7D&file=not-gdrive.docx&action=default&mobileredirect=true'),
        configs,
      );
      expect(new URL(fetchMock.calls().pop()[0]).searchParams.getAll('hint')).to.deep.equal([]);
    });

    it('sharepoint url with root folder', async () => {
      await urlCache.set(mockTab('https://foo.sharepoint.com/sites/foo/Shared%20Documents/Forms/AllItems.aspx?id=%2Fsites%2Ffoo%2FShared%20Documents%2Ffoo&viewid=77cb4d37%2D30e2%2D4762%2D87ef%2D5ad0e1059258&RootFolder=1234'));
      expect(fetchMock.calls().length).to.equal(3);
      expect(sessionSet.callCount).to.equal(1);
    });

    it('fetch root item fails', async () => {
      // : 3 fetchSpy calls, 1 storageSpy call
      await urlCache.set(mockTab('https://foo.sharepoint.com/:w:/r/sites/foo/_layouts/15/Doc.aspx?sourcedoc=%7BBFD9A19C-4A68-4DBF-8641-DA2F1283C896%7D&file=index.docx&action=default&mobileredirect=true'));
      expect(fetchMock.calls().length).to.equal(3);
      expect(sessionSet.callCount).to.equal(1);
    });

    it('fetch edit info fails', async () => {
      fetchMock = mockDiscoveryCall({ failEditInfo: true });
      await urlCache.set(mockTab('https://foo.sharepoint.com/:w:/r/sites/foo/_layouts/15/Doc.aspx?sourcedoc=%7BBFD9A19C-4A68-4DBF-8641-DA2F1283C895%7D&file=blu.docx&action=default&mobileredirect=true'));
      expect(fetchMock.calls().length).to.equal(2);
      expect(sessionSet.callCount).to.equal(1);
    });

    it('fetch root item fails', async () => {
      fetchMock = mockDiscoveryCall({ failRootItem: true });
      await urlCache.set(mockTab('https://foo.sharepoint.com/:w:/r/sites/foo/_layouts/15/Doc.aspx?sourcedoc=%7BBFD9A19C-4A68-4DBF-8641-DA2F1283C895%7D&file=bla.docx&action=default&mobileredirect=true'));
      expect(fetchMock.calls().length).to.equal(3);
      expect(sessionSet.callCount).to.equal(1);
    });

    it('discovery empty', async () => {
      fetchMock = mockDiscoveryCall({ emptyDiscovery: true });
      await urlCache.set(mockTab('https://foo.sharepoint.com/:w:/r/sites/foo/_layouts/15/Doc.aspx?sourcedoc=%7BBFD9A19C-4A68-4DBF-8641-DA2F1283C895%7D&file=baz.docx&action=default&mobileredirect=true'));
      expect(fetchMock.calls().length).to.equal(3);
      expect(sessionSet.callCount).to.equal(1);
    });

    it('discovery fails', async () => {
      fetchMock = mockDiscoveryCall({ failDiscovery: true });
      await urlCache.set(mockTab('https://foo.sharepoint.com/:w:/r/sites/foo/_layouts/15/Doc.aspx?sourcedoc=%7BBFD9A19C-4A68-4DBF-8641-DA2F1283C895%7D&file=baz.docx&action=default&mobileredirect=true'));
      expect(fetchMock.calls().length).to.equal(3);
      expect(sessionSet.callCount).to.equal(1);
    });

    it('script injection fails', async () => {
      sandbox.stub(window.chrome.scripting, 'executeScript').rejects(error);
      await urlCache.set(mockTab('https://foo.sharepoint.com/:w:/r/sites/foo/_layouts/15/Doc.aspx?sourcedoc=%7BBFD9A19E-4A68-4DBF-8641-DA2F1283C895%7D&file=baz.docx&action=default&mobileredirect=true'));
      expect(fetchMock.calls().length).to.equal(1);
      expect(sessionSet.callCount).to.equal(1);
    });

    it('unexpected response from tab', async () => {
      sendMessage.restore();
      sendMessage = sandbox.stub(window.chrome.runtime, 'sendMessage').callsFake(() => onMessageListener({ }, { tab: { id: 0 } }));
      await urlCache.set(mockTab('https://foo.sharepoint.com/:w:/r/sites/foo/_layouts/15/Doc.aspx?sourcedoc=%70BFD9A19E-4A68-4DBF-8641-DA2F1283C895%7D&file=baz.docx&action=default&mobileredirect=true'));
      expect(fetchMock.calls().length).to.equal(3);
      expect(sessionSet.callCount).to.equal(1);
    });
  });

  describe('get', () => {
    let sessionGet;

    beforeEach(() => {
      sessionGet = sandbox.spy(window.chrome.storage.session, 'get');
    });

    afterEach(() => {
      sessionGet.resetHistory();
    });

    it('known url', async () => {
      // known url
      const results = await urlCache.get(mockTab('https://foo.sharepoint.com/:w:/r/sites/foo/_layouts/15/Doc.aspx?sourcedoc=%7BBFD9A19C-4A68-4DBF-8641-DA2F1283C895%7D&file=index.docx&action=default&mobileredirect=true'));
      expect(results.length).to.equal(2);
      expect(sessionGet.callCount).to.equal(1);
    });

    it('unknown url', async () => {
      const results = await urlCache.get(mockTab('https://foo.sharepoint.com/:x:/r/sites/foo/_layouts/15/Doc.aspx?sourcedoc=%7ABFD9A19C-4A68-4DBF-8641-DA2F1283C895%7D&file=index.xlsx&action=default&mobileredirect=true'));
      expect(results.length).to.equal(0);
      expect(sessionGet.callCount).to.equal(1);
    });

    it('static url', async () => {
      const results = await urlCache.get(mockTab('https://random.foo.bar/'));
      expect(results.length).to.equal(1);
      expect(sessionGet.callCount).to.equal(1);
    });
  });
});
