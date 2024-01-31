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
import checkTab from '../../src/extension/tab.js';
import { error } from './test-utils.js';

// @ts-ignore
window.chrome = chromeMock;

const TABS = {
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

describe('Test check-tab', () => {
  const sandbox = sinon.createSandbox();

  before(async () => {
    await setUserAgent('HeadlessChrome');
  });

  beforeEach(async () => {
    sinon.stub(chrome.tabs, 'get').callsFake(async (id) => (id ? TABS[id] : {}));
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('checkTab', async () => {
    const executeScriptSpy = sandbox.spy(chrome.scripting, 'executeScript');
    const sendMessageSpy = sandbox.spy(chrome.tabs, 'sendMessage');

    // check tab with invalid URL
    // @ts-ignore
    await checkTab();
    expect(executeScriptSpy.callCount).to.equal(0);

    // check tab with URL from configured project
    await checkTab(1);
    expect(executeScriptSpy.calledWith({
      target: { tabId: 1 },
      files: ['./content.js'],
    })).to.be.true;
    expect(sendMessageSpy.called).to.be.true;

    // check tab with unknown URL
    await checkTab(2);
    expect(executeScriptSpy.callCount).to.equal(1);

    // check tab with dev URL
    sinon.stub(chrome.storage.sync, 'get')
      .callsFake(async (prop) => new Promise((resolve) => {
        if (prop === 'projects') {
          resolve({
            // @ts-ignore
            projects: [
              'foo/bar',
            ],
          });
        }
        if (prop === 'foo/bar') {
          resolve({
            // @ts-ignore
            'foo/bar': {
              owner: 'foo',
              repo: 'bar',
              ref: 'main',
              devOrigin: 'http://localhost:2001',
            },
          });
        }
        resolve();
      }));
    sinon.stub(chrome.runtime.onMessage, 'addListener')
      .callsFake((func, _) => func(
        { proxyUrl: document.head.querySelector('meta[property="hlx:proxyUrl"]')?.getAttribute('content') },
        { tab: TABS[3] },
      ));
    const proxyUrl = document.createElement('meta');
    proxyUrl.setAttribute('property', 'hlx:proxyUrl');
    proxyUrl.setAttribute('content', 'https://main--bar--foo.hlx.page/');
    window.document.head.append(proxyUrl);
    await checkTab(3);
    expect(executeScriptSpy.callCount).to.equal(3);
    proxyUrl.remove();
    await checkTab(3);
    expect(executeScriptSpy.callCount).to.equal(4);

    // error handling
    executeScriptSpy.restore();
    sandbox.stub(chrome.scripting, 'executeScript').throws(error);
    await checkTab(1);
    sinon.restore();
    let counter = 0;
    sandbox.stub(chrome.tabs, 'get').callsFake(async (id) => {
      counter += 1;
      if (counter === 1) {
        return TABS[id];
      } else {
        return null;
      }
    });
    // tab still exists at first, but not at second call
    await checkTab(1);
    // tab no longer exist
    await checkTab(1);
  });
});
