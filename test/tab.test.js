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
import checkTab from '../src/extension/tab.js';
import { error } from './test-utils.js';

// @ts-ignore
window.chrome = chromeMock;

const TABS = {
  0: {
    id: 0,
  },
  1: {
    id: 1,
    url: 'https://main--blog--adobe.hlx.page/',
  },
  2: {
    id: 2,
    url: 'https://www.example.com/',
  },
  3: {
    id: 3,
    url: 'http://localhost:2001/',
  },
  4: {
    id: 4,
    url: 'http://github.com/foo/bar',
  },
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
      // @ts-ignore
      .callsFake((func, _) => func(
        msg,
        {
          tab,
        },
      ));
    return stub;
  }

  function fakeGetProjects(cfg = {}) {
    const stub = sandbox.stub(chrome.storage.sync, 'get')
      .callsFake(async (prop) => new Promise((resolve) => {
        if (prop === 'projects') {
          // @ts-ignore
          resolve({ projects: Object.keys(cfg) });
        }
        if (cfg[prop]) {
          // @ts-ignore
          resolve({ [prop]: cfg[prop] });
        }
        resolve();
      }));
    return stub;
  }

  before(async () => {
    await setUserAgent('HeadlessChrome');
  });

  beforeEach(async () => {
    fakeGetProjects(PROJECTS);
    executeScriptSpy = sandbox.spy(chrome.scripting, 'executeScript');
    onMessageAddListenerStub = fakeListenerCallback({ msg: { isAEM: true } });
    getTabSpy = sandbox.stub(chrome.tabs, 'get').callsFake(async (id) => TABS[id]);
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

  it('checkTab: url from configured project (display on)', async () => {
    sandbox.stub(chrome.storage.local, 'get').withArgs('display').resolves({ display: true });
    const tab = TABS[1];
    await checkTab(tab.id);
    expect(executeScriptSpy.callCount).to.equal(1);
    expect(executeScriptSpy.calledWith({
      target: { tabId: tab.id },
      files: ['./content.js'],
    })).to.be.true;
  });

  it('checkTab: url from configured project (display off)', async () => {
    sandbox.stub(chrome.storage.local, 'get').withArgs('display').resolves({ display: false });
    const tab = TABS[1];
    await checkTab(tab.id);
    expect(executeScriptSpy.callCount).to.equal(0);
    expect(executeScriptSpy.calledWith({
      target: { tabId: tab.id },
      files: ['./content.js'],
    })).to.be.false;
  });

  it('checkTab: unknown url', async () => {
    const tab = TABS[2];
    await checkTab(tab.id);
    expect(executeScriptSpy.callCount).to.equal(0);
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
    expect(executeScriptSpy.callCount).to.equal(1);

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
    expect(executeScriptSpy.callCount).to.equal(1);
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
    getTabSpy = sandbox.stub(chrome.tabs, 'get').callsFake(async (id) => {
      counter += 1;
      if (counter === 1) {
        return TABS[id];
      } else {
        return null;
      }
    });
    await checkTab(1);
    expect(executeScriptSpy.callCount).to.equal(0);
  });
});
