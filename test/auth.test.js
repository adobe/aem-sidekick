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
  CACHE_MAX_AGE_SECONDS,
  configureAuthAndCorsHeaders,
  getCacheControlRules,
  getHostDomain,
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

  describe('getHostDomain', () => {
    it('returns hostname for full URL', () => {
      expect(getHostDomain('https://example.com/path')).to.equal('example.com');
      expect(getHostDomain('https://sub.example.com:443/')).to.equal('sub.example.com');
    });
    it('returns input for plain domain', () => {
      expect(getHostDomain('example.com')).to.equal('example.com');
      expect(getHostDomain('main--repo--owner.aem.live')).to.equal('main--repo--owner.aem.live');
    });
    it('returns empty string for invalid or empty input', () => {
      expect(getHostDomain('')).to.equal('');
      expect(getHostDomain(null)).to.equal('');
      expect(getHostDomain(undefined)).to.equal('');
      expect(getHostDomain(123)).to.equal('');
    });
  });

  describe('getCacheControlRules', () => {
    it('returns one rule per unique host', () => {
      const configs = [
        { host: 'prod.example.com', previewHost: 'preview.example.com' },
        { liveHost: 'live.example.com' },
      ];
      const rules = getCacheControlRules(configs);
      expect(rules).to.have.lengthOf(3);
      expect(rules.every((r) => r.action?.responseHeaders?.[0]?.header === 'Cache-Control')).to.be.true;
      expect(rules.every((r) => r.action.responseHeaders[0].value === `max-age=${CACHE_MAX_AGE_SECONDS}`)).to.be.true;
      const filters = rules.map((r) => r.condition.regexFilter);
      expect(filters).to.include('^https://prod\\.example\\.com/.*');
      expect(filters).to.include('^https://preview\\.example\\.com/.*');
      expect(filters).to.include('^https://live\\.example\\.com/.*');
    });
    it('deduplicates same host across configs', () => {
      const configs = [
        { host: 'same.com', previewHost: 'same.com' },
        { liveHost: 'same.com' },
      ];
      const rules = getCacheControlRules(configs);
      expect(rules).to.have.lengthOf(1);
      expect(rules[0].condition.regexFilter).to.equal('^https://same\\.com/.*');
    });
    it('extracts host from full URL in config', () => {
      const configs = [{ host: 'https://url-host.com/path' }];
      const rules = getCacheControlRules(configs);
      expect(rules).to.have.lengthOf(1);
      expect(rules[0].condition.regexFilter).to.equal('^https://url-host\\.com/.*');
    });
    it('returns empty array for empty or no valid hosts', () => {
      expect(getCacheControlRules([])).to.deep.equal([]);
      expect(getCacheControlRules([{ host: '' }, { previewHost: null }])).to.deep.equal([]);
    });
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
            regexFilter: '^https://[a-z0-9-]+--site--test\\.aem\\.(page|live|reviews)/.*',
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
          requestMethods: ['get', 'post', 'delete'],
          resourceTypes: ['xmlhttprequest'],
        },
      }],
    })).to.be.true;
  });
});
