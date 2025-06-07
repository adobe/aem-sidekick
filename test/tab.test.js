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
import { checkTab, getCurrentTab } from '../src/extension/tab.js';
import { error, mockTab } from './test-utils.js';
import { log } from '../src/extension/log.js';
import { urlCache } from '../src/extension/url-cache.js';

// @ts-ignore
window.chrome = chromeMock;

const TABS = {
  0: mockTab(null, { id: '0' }),
  1: mockTab('https://main--blog--adobe.hlx.page/', { id: '1' }),
  2: mockTab('https://www.example.com/', { id: '2' }),
  3: mockTab('http://localhost:2001/', { id: '3' }),
  4: mockTab('http://github.com/foo/bar', { id: '4' }),
  5: mockTab('https://foo.sharepoint.com/:w:/r/sites/foo/_layouts/15/Doc.aspx?sourcedoc=%7BBFD9A19C-4A68-4DBF-8641-DA2F1283C895%7D&file=bla.docx&action=default&mobileredirect=true', { id: '5' }),
};

const PROJECTS = {
  'foo/bar': {
    owner: 'foo',
    repo: 'bar',
    ref: 'main',
  },
  'adobe/blog': {
    owner: 'adobe',
    repo: 'blog',
    ref: 'main',
    devOrigin: 'http://localhost:2001',
  },
};

describe('Test check-tab', () => {
  const sandbox = sinon.createSandbox();
  let getTabSpy;
  let executeScriptSpy;
  let onMessageAddListenerStub;

  function fakeListenerCallback({ msg, api = chrome.runtime.onMessage, tab = TABS[1] }) {
    const stub = sandbox.stub(api, 'addListener')
      .callsFake((callback) => {
        // @ts-ignore - Chrome types are not fully accurate
        callback(msg, { tab }, () => {});
        return true;
      });
    return stub;
  }

  function fakeGetProjects(cfg = {}) {
    const stub = sandbox.stub(chrome.storage.sync, 'get');

    // Handle different ways the storage API can be called
    stub.withArgs('projects').resolves({ projects: Object.keys(cfg) });

    // Handle individual project lookups
    Object.keys(cfg).forEach((key) => {
      stub.withArgs(key).resolves({ [key]: cfg[key] });
    });

    // Default case
    stub.resolves({});

    return stub;
  }

  before(async () => {
    await setUserAgent('HeadlessChrome');
  });

  beforeEach(async () => {
    fakeGetProjects(PROJECTS);
    executeScriptSpy = sandbox.spy(chrome.scripting, 'executeScript');
    onMessageAddListenerStub = fakeListenerCallback({ msg: { isAEM: true } });
    sandbox.stub(urlCache, 'set').resolves();
    getTabSpy = sandbox.stub(chrome.tabs, 'get').callsFake(async (id) => TABS[String(id)]);
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('checkTab: no tab', async () => {
    // @ts-ignore
    await checkTab();
    expect(executeScriptSpy.callCount).to.equal(0);
  });

  it('checkTab: invalid tab', async () => {
    await checkTab(9);
    expect(executeScriptSpy.callCount).to.equal(0);
  });

  it('checkTab: no tab url', async () => {
    await checkTab(0);
    expect(executeScriptSpy.callCount).to.equal(0);
  });

  it('checkTab: url from configured project', async () => {
    sandbox.stub(chrome.storage.local, 'get').withArgs('display').resolves({ display: true });
    const tab = TABS[1];
    await checkTab(tab.id);
    expect(executeScriptSpy.callCount).to.equal(1);
    expect(executeScriptSpy.calledWith({
      target: { tabId: tab.id },
      files: ['./content.js'],
    })).to.be.true;
  });

  it('checkTab: development url', async () => {
    const tab = TABS[3];
    // add proxyUrl meta tag
    const proxyUrl = document.createElement('meta');
    proxyUrl.setAttribute('property', 'hlx:proxyUrl');
    proxyUrl.setAttribute('content', 'https://main--bar--foo.hlx.page/');
    window.document.head.append(proxyUrl);

    onMessageAddListenerStub.restore();
    onMessageAddListenerStub = fakeListenerCallback({
      msg: {
        proxyUrl: document.head.querySelector('meta[property="hlx:proxyUrl"]')?.getAttribute('content'),
        isAEM: true,
      },
      tab,
    });

    await checkTab(tab.id);
    expect(executeScriptSpy.callCount).to.equal(2);

    // check again without proxyUrl meta tag
    proxyUrl.remove();
    executeScriptSpy.restore();
    onMessageAddListenerStub.restore();
    onMessageAddListenerStub = fakeListenerCallback({
      msg: {
        proxyUrl: null,
        isAEM: true,
      },
      tab,
    });

    await checkTab(tab.id);
    expect(executeScriptSpy.callCount).to.equal(2);
  });

  it('checkTab: tab no longer exists', async () => {
    const logSpy = sandbox.spy(log, 'warn');
    getTabSpy.restore();
    getTabSpy = sandbox.stub(chrome.tabs, 'get').rejects();
    await checkTab(1);

    expect(logSpy.callCount).to.equal(1);
    expect(logSpy.args[0][0]).to.equal('checkTab: error checking tab 1');
  });

  it('checkTab: script injection fails', async () => {
    sandbox.stub(chrome.storage.local, 'get').withArgs('display').resolves({ display: true });
    executeScriptSpy.restore();
    executeScriptSpy = sandbox.stub(chrome.scripting, 'executeScript').throws(error);
    await checkTab(1);
  });

  it('checkTab: tab no longer exists upon script injection', async () => {
    let counter = 0;
    getTabSpy.restore();
    getTabSpy = sandbox.stub(chrome.tabs, 'get').callsFake(async (id) => new Promise((resolve, reject) => {
      counter += 1;
      if (counter === 1) {
        resolve(TABS[id]);
      } else {
        reject();
      }
    }));
    await checkTab(1);
    expect(executeScriptSpy.callCount).to.equal(1);
  });

  it('checkTab: injects sharepoint listener if sharepoint host', async () => {
    const tab = TABS[5];

    // Restore and re-stub executeScript
    executeScriptSpy.resetHistory();

    await checkTab(tab.id);

    // Verify SharePoint specific behavior
    expect(executeScriptSpy.calledWithMatch({
      target: { tabId: tab.id, allFrames: true },
      injectImmediately: true,
    })).to.be.true;
  });

  it('checkTab: handles multiple project matches', async () => {
    const tab = TABS[1];

    // Start fresh with a new sandbox
    sandbox.restore();

    // Setup all required stubs for this test
    sandbox.stub(chrome.storage.local, 'get')
      .withArgs('display')
      .resolves({ display: true });

    executeScriptSpy = sandbox.spy(chrome.scripting, 'executeScript');

    // Setup message listener to indicate it's an AEM page
    onMessageAddListenerStub = fakeListenerCallback({
      msg: { isAEM: true },
      tab,
    });

    // Setup tab spy
    getTabSpy = sandbox.stub(chrome.tabs, 'get')
      .callsFake(async (id) => TABS[String(id)]);

    // Setup storage stub with multiple projects and their configs
    const storageStub = sandbox.stub(chrome.storage.sync, 'get');
    storageStub.withArgs('projects')
      .resolves({ projects: ['adobe/blog', 'adobe/blog-test'] });
    storageStub.withArgs('adobe/blog')
      .resolves({ 'adobe/blog': PROJECTS['adobe/blog'] });
    storageStub.withArgs('adobe/blog-test')
      .resolves({ 'adobe/blog-test': { ...PROJECTS['adobe/blog'], repo: 'blog-test' } });
    storageStub.resolves({});

    await checkTab(tab.id);

    // Verify script injection still happens with multiple matches
    expect(executeScriptSpy.callCount).to.equal(1);
    expect(executeScriptSpy.calledWith({
      target: { tabId: tab.id },
      files: ['./content.js'],
    })).to.be.true;
  });

  it('getCurrentTab', async () => {
    // @ts-ignore
    sandbox.stub(chrome.tabs, 'query').withArgs({ active: true, currentWindow: true }).resolves([TABS[1]]);
    const tab = await getCurrentTab();
    expect(tab).to.equal(TABS[1]);
  });

  it('getCurrentTab: no active tab', async () => {
    sandbox.stub(chrome.tabs, 'query')
      .withArgs({ active: true, currentWindow: true })
      .resolves([]);
    const tab = await getCurrentTab();
    expect(tab).to.be.undefined;
  });

  it('getCurrentTab: multiple tabs returned', async () => {
    const mockTabs = [
      mockTab('https://example.com/1', { id: '1' }),
      mockTab('https://example.com/2', { id: '2' }),
    ];
    sandbox.stub(chrome.tabs, 'query')
      .withArgs({ active: true, currentWindow: true })
      .resolves(mockTabs);
    const tab = await getCurrentTab();
    expect(tab).to.equal(mockTabs[0]); // Should return first tab
  });

  it('getCurrentTab: handles query error', async () => {
    sandbox.stub(chrome.tabs, 'query')
      .withArgs({ active: true, currentWindow: true })
      .rejects(new Error('Query failed'));
    try {
      await getCurrentTab();
      expect.fail('Should have thrown an error');
    } catch (e) {
      expect(e.message).to.equal('Query failed');
    }
  });
});
