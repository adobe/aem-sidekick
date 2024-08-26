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

// @ts-nocheck

import { expect } from '@open-wc/testing';
import { setUserAgent } from '@web/test-runner-commands';
import sinon from 'sinon';

import { configureAuthAndCorsHeaders, setAuthToken } from '../src/extension/auth.js';
import chromeMock from './mocks/chrome.js';
import { error } from './test-utils.js';

// @ts-ignore
window.chrome = chromeMock;

describe('Test auth', () => {
  const sandbox = sinon.createSandbox();

  before(async () => {
    await setUserAgent('HeadlessChrome');
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('configureAuthAndCorsHeaders', async () => {
    const getSessionRules = sandbox.stub(chrome.declarativeNetRequest, 'getSessionRules')
      // @ts-ignore
      .resolves([{ id: 1 }]);
    const updateSessionRules = sandbox.spy(chrome.declarativeNetRequest, 'updateSessionRules');
    await configureAuthAndCorsHeaders();
    expect(getSessionRules.called).to.be.true;
    expect(updateSessionRules.called).to.be.true;
    // error handling
    updateSessionRules.restore();
    sandbox.stub(chrome.declarativeNetRequest, 'updateSessionRules')
      .throws(error);
    await configureAuthAndCorsHeaders();
  });

  it('setAuthToken', async () => {
    const updateSessionRules = sandbox.spy(chrome.declarativeNetRequest, 'updateSessionRules');
    const getConfig = sandbox.spy(chrome.storage.session, 'get');
    const setConfig = sandbox.spy(chrome.storage.session, 'set');
    const owner = 'test';
    const authToken = '1234567890';
    const authTokenExpiry = Date.now() / 1000 + 60;

    // set auth token
    await setAuthToken(owner, authToken, authTokenExpiry);
    expect(getConfig.callCount).to.equal(2);
    expect(setConfig.callCount).to.be.equal(1);
    // update auth token without expiry
    await setAuthToken(owner, authToken);
    expect(getConfig.callCount).to.equal(4);
    expect(setConfig.callCount).to.be.equal(2);
    // remove auth token
    await setAuthToken(owner, '');
    expect(setConfig.callCount).to.equal(3);
    // remove auth token again
    await setAuthToken(owner, '');
    expect(setConfig.callCount).to.equal(4);
    // testing else paths
    getConfig.resetHistory();
    setConfig.resetHistory();
    // @ts-ignore
    await setAuthToken();
    expect(getConfig.notCalled).to.be.true;
    expect(setConfig.notCalled).to.be.true;

    expect(updateSessionRules.calledWith(
      {
        addRules: [
          {
            id: 2,
            priority: 1,
            action: {
              type: 'modifyHeaders',
              requestHeaders: [
                {
                  operation: 'set',
                  header: 'x-auth-token',
                  value: '1234567890',
                },
              ],
            },
            condition: {
              regexFilter: '^https://admin.hlx.page/[a-z]+/test/.*',
              requestDomains: [
                'admin.hlx.page',
              ],
              requestMethods: [
                'get',
                'post',
                'delete',
              ],
              resourceTypes: [
                'xmlhttprequest',
              ],
            },
          },
          {
            id: 3,
            priority: 1,
            action: {
              type: 'modifyHeaders',
              responseHeaders: [
                {
                  header: 'Access-Control-Allow-Origin',
                  operation: 'set',
                  value: '*',
                },
              ],
            },
            condition: {
              regexFilter: '^https://[0-9a-z-]+--[0-9a-z-]+--test.(hlx|aem).(live|page)/.*',
              initiatorDomains: [
                'tools.aem.live',
                'labs.aem.live',
              ],
              requestMethods: [
                'get',
              ],
              resourceTypes: [
                'xmlhttprequest',
              ],
            },
          },
        ],
      },
    )).to.be.true;
  });
});
