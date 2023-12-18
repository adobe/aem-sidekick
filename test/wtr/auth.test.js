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

import { addAuthTokenHeaders, setAuthToken } from '../../src/extension/auth.js';
import chromeMock from './mocks/chrome.js';

window.chrome = chromeMock;

describe('Test auth', () => {
  const sandbox = sinon.createSandbox();

  before(async () => {
    await setUserAgent('HeadlessChrome');
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('addAuthTokenHeaders', async () => {
    const getSessionRules = sandbox.spy(chrome.declarativeNetRequest, 'getSessionRules');
    const updateSessionRules = sandbox.spy(chrome.declarativeNetRequest, 'updateSessionRules');
    await addAuthTokenHeaders();
    expect(getSessionRules.called).to.be.true;
    expect(updateSessionRules.called).to.be.true;
    // error handling
    updateSessionRules.restore();
    sandbox.stub(chrome.declarativeNetRequest, 'updateSessionRules')
      .throws(new Error('this is just a test'));
    const spy = sandbox.spy(console, 'log');
    await addAuthTokenHeaders();
    expect(spy.called).to.be.true;
  });

  it('setAuthToken', async () => {
    const getConfig = sandbox.spy(chrome.storage.session, 'get');
    const setConfig = sandbox.spy(chrome.storage.session, 'set');
    const removeConfig = sandbox.spy(chrome.storage.session, 'remove');
    const owner = 'test';
    const repo = 'project';
    const authToken = '1234567890';
    const authTokenExpiry = Date.now() / 1000 + 60;

    // set auth token
    await setAuthToken(owner, repo, authToken, authTokenExpiry);
    expect(getConfig.called).to.be.true;
    expect(setConfig.called).to.be.true;
    // remove auth token
    await setAuthToken(owner, repo, '');
    expect(removeConfig.calledWith('test/project')).to.be.true;
  });
});
