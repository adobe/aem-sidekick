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
import checkTab from '../../src/extension/check-tab.js';
import { sleep } from './test-utils.js';

window.chrome = chromeMock;

describe('Test checkTab', () => {
  const sandbox = sinon.createSandbox();

  before(async () => {
    await setUserAgent('HeadlessChrome');
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('checkTab', async () => {
    const executeScriptSpy = sandbox.spy(chrome.scripting, 'executeScript');
    const sendMessageSpy = sandbox.spy(chrome.tabs, 'sendMessage');
    // check tab with invalid URL
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
    expect(executeScriptSpy.calledOnce).to.be.true;
    // check tab with dev URL
    checkTab(3); // don't await checkTab here, getProxyUrl will timeout
    await sleep(500);
    expect(executeScriptSpy.calledTwice).to.be.true;
    // error handling
    executeScriptSpy.restore();
    const error = new Error('testing error handling');
    const consoleSpy = sandbox.spy(console, 'log');
    sandbox.stub(chrome.scripting, 'executeScript').throws(error);
    await checkTab(1);
    expect(consoleSpy.called).to.be.true;
  });
});
