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

import {
  configureAuthAndCorsHeaders,
  setAuthToken,
  updateUserAgent,
} from '../src/extension/auth.js';
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
    const repo = 'site';
    const authToken = '1234567890';
    const authTokenExpiry = Date.now() + 60000;

    // set auth token
    await setAuthToken(owner, repo, authToken, authTokenExpiry);
    expect(getConfig.callCount).to.equal(2);
    expect(setConfig.callCount).to.be.equal(1);
    // update auth token without expiry
    await setAuthToken(owner, repo, authToken);
    expect(getConfig.callCount).to.equal(4);
    expect(setConfig.callCount).to.be.equal(2);
    // remove auth token
    await setAuthToken(owner, repo, '');
    expect(setConfig.callCount).to.equal(3);
    // remove auth token again
    await setAuthToken(owner, repo, '');
    expect(setConfig.callCount).to.equal(4);
    // testing else paths
    getConfig.resetHistory();
    setConfig.resetHistory();
    // @ts-ignore
    await setAuthToken();
    expect(getConfig.notCalled).to.be.true;
    expect(setConfig.notCalled).to.be.true;

    expect(updateSessionRules.calledWith({
      addRules: [
        {
          id: sinon.match.number,
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
            excludedInitiatorDomains: ['da.live'],
            regexFilter: '^https://admin.hlx.page/(config/test\\.json|[a-z]+/test/.*)',
            requestDomains: [
              'admin.hlx.page',
            ],
            requestMethods: [
              'get',
              'put',
              'post',
              'delete',
            ],
            resourceTypes: [
              'xmlhttprequest',
            ],
          },
        },
        {
          id: sinon.match.number,
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
            regexFilter: '^https://[0-9a-z-]+--[0-9a-z-]+--test\\.aem\\.(page|live|reviews)/.*',
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

  it('setAuthToken (added project)', async () => {
    const updateSessionRules = sandbox.spy(chrome.declarativeNetRequest, 'updateSessionRules');
    const getConfig = sandbox.spy(chrome.storage.session, 'get');
    const setConfig = sandbox.spy(chrome.storage.session, 'set');
    const owner = 'test';
    const repo = 'site';
    const authToken = '1234567890';

    sandbox.stub(chrome.storage.sync, 'get').resolves({
      'test/site': {
        host: 'production-host.com',
        previewHost: 'custom-preview.com',
        liveHost: 'custom-live.com',
      },
    });

    await setAuthToken(owner, repo, authToken);
    expect(setConfig.callCount).to.equal(1);
    expect(getConfig.callCount).to.equal(2);

    expect(updateSessionRules.calledWith({
      addRules: [
        {
          id: sinon.match.number,
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
            excludedInitiatorDomains: ['da.live'],
            regexFilter: '^https://admin.hlx.page/(config/test\\.json|[a-z]+/test/.*)',
            requestDomains: [
              'admin.hlx.page',
            ],
            requestMethods: [
              'get',
              'put',
              'post',
              'delete',
            ],
            resourceTypes: [
              'xmlhttprequest',
            ],
          },
        },
        {
          id: sinon.match.number,
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
            regexFilter: '^https://[0-9a-z-]+--[0-9a-z-]+--test\\.aem\\.(page|live|reviews)/.*',
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
        {
          id: sinon.match.number,
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
            regexFilter: '^https://production-host.com/.*',
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
        {
          id: sinon.match.number,
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
            regexFilter: '^https://custom-preview.com/.*',
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
        {
          id: sinon.match.number,
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
            regexFilter: '^https://custom-live.com/.*',
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

  it('setAuthToken with transient site token', async () => {
    const updateSessionRules = sandbox.spy(chrome.declarativeNetRequest, 'updateSessionRules');
    const getConfig = sandbox.spy(chrome.storage.session, 'get');
    const setConfig = sandbox.spy(chrome.storage.session, 'set');
    const owner = 'test';
    const repo = 'site';
    const authToken = '1234567890';
    const siteToken = '0987654321';
    let expiry = Date.now() + 60000;

    await setAuthToken(owner, repo, authToken, expiry, siteToken, expiry);
    expect(setConfig.callCount).to.equal(1);
    expect(getConfig.callCount).to.equal(2);

    expect(updateSessionRules.calledWith({
      addRules: [
        {
          id: sinon.match.number,
          priority: 1,
          action: {
            type: 'modifyHeaders',
            requestHeaders: [
              {
                operation: 'set',
                header: 'x-auth-token',
                value: authToken,
              },
            ],
          },
          condition: {
            excludedInitiatorDomains: ['da.live'],
            regexFilter: '^https://admin.hlx.page/(config/test\\.json|[a-z]+/test/.*)',
            requestDomains: [
              'admin.hlx.page',
            ],
            requestMethods: [
              'get',
              'put',
              'post',
              'delete',
            ],
            resourceTypes: [
              'xmlhttprequest',
            ],
          },
        },
        {
          id: sinon.match.number,
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
            regexFilter: '^https://[0-9a-z-]+--[0-9a-z-]+--test\\.aem\\.(page|live|reviews)/.*',
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
        {
          id: sinon.match.number,
          priority: 1,
          action: {
            type: 'modifyHeaders',
            requestHeaders: [
              {
                operation: 'set',
                header: 'authorization',
                value: `token ${siteToken}`,
              },
            ],
          },
          condition: {
            regexFilter: sinon.match((value) => {
              const regex = new RegExp(value);
              // Should match aem.page, aem.live, and aem.reviews URLs
              const shouldMatch = [
                'https://main--site--test.aem.page/index.html',
                'https://preview--site--test.aem.live/document.html',
                'https://feature-branch--site--test.aem.reviews/test.html',
                // Should match localhost with various ports
                'http://localhost:3000/',
                'http://localhost:3000/index.html',
                'http://localhost:8080/path/to/file.html',
                'http://localhost:65535/test',
              ];
              const shouldNotMatch = [
                'https://example.com/',
                'http://localhost/', // no port
                'https://localhost:3000/', // https instead of http
                'http://127.0.0.1:3000/', // IP instead of localhost
                'http://localhost:3000', // no trailing slash
              ];
              return shouldMatch.every((url) => regex.test(url))
                && shouldNotMatch.every((url) => !regex.test(url));
            }),
            requestMethods: [
              'get',
              'post',
            ],
            resourceTypes: [
              'main_frame',
              'sub_frame',
              'script',
              'stylesheet',
              'image',
              'xmlhttprequest',
              'media',
              'font',
              'other',
            ],
          },
        },
      ],
    },
    )).to.be.true;

    // update existing auth and site tokens
    expiry = Date.now() + 120000;
    await setAuthToken(owner, repo, authToken, expiry, siteToken, expiry);
    expect(setConfig.callCount).to.equal(2);
    expect(getConfig.callCount).to.equal(4);
    expect(updateSessionRules.callCount).to.equal(4);

    // remove existing auth and site tokens
    await setAuthToken(owner, repo, '', undefined, '', undefined);
    expect(setConfig.callCount).to.equal(3);
    expect(getConfig.callCount).to.equal(6);
    expect(updateSessionRules.callCount).to.equal(5);
  });

  it('updateUserAgent', async () => {
    const updateDynamicRules = sandbox.spy(chrome.declarativeNetRequest, 'updateDynamicRules');
    await updateUserAgent();
    expect(updateDynamicRules.callCount).to.equal(2); // remove all and add new
    expect(updateDynamicRules.calledWith({
      addRules: [{
        id: sinon.match.number,
        priority: 1,
        action: {
          type: 'modifyHeaders',
          requestHeaders: [{
            header: 'User-Agent',
            operation: 'set',
            value: 'HeadlessChrome AEMSidekick/0.0.0',
          }],
        },
        condition: {
          regexFilter: '^https://admin.hlx.page/.*',
          requestDomains: ['admin.hlx.page'],
          requestMethods: ['get', 'put', 'post', 'delete'],
          resourceTypes: ['xmlhttprequest'],
        },
      }],
    })).to.be.true;
  });
});
