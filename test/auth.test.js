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

import { setAuthToken } from '../src/extension/auth.js';
import chromeMock from './mocks/chrome.js';
import { checkTab } from '../src/extension/tab.js';

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

  it('setAuthToken', async () => {
    const updateSessionRules = sandbox.spy(chrome.declarativeNetRequest, 'updateSessionRules');
    const setConfig = sandbox.spy(chrome.storage.session, 'set');
    const owner = 'test';
    const repo = 'site';
    const authToken = '1234567890';
    const authTokenExpiry = Date.now() / 1000 + 60;

    const mockTab = { id: 1234, url: 'https://main--site--test.aem.live' };
    sandbox.stub(chrome.tabs, 'query')
      .withArgs({ active: true, currentWindow: true })
      .resolves([mockTab]);

    sandbox.stub(chrome.tabs, 'get')
      .withArgs(mockTab.id)
      .resolves(mockTab);

    // set auth token
    await setAuthToken(owner, repo, authToken, authTokenExpiry);
    expect(setConfig.calledWith({
      projects: [
        {
          id: owner,
          owner,
          repo,
          authToken,
          authTokenExpiry: authTokenExpiry * 1000,
          picture: undefined,
        },
      ],
    })).to.be.true;

    await checkTab(mockTab.id);

    // update auth token without expiry
    await setAuthToken(owner, repo, authToken);
    expect(setConfig.calledWith({
      projects: [
        {
          id: owner,
          owner,
          repo,
          authToken,
          authTokenExpiry: 0,
          picture: undefined,
        },
      ],
    })).to.be.true;
    await checkTab(mockTab.id);

    // remove auth token
    await setAuthToken(owner, repo, '');
    expect(setConfig.calledWith({
      projects: [],
    })).to.be.true;
    await checkTab(mockTab.id);

    // remove auth token again
    await setAuthToken(owner, repo, '');
    expect(setConfig.calledWith({
      projects: [],
    })).to.be.true;
    await checkTab(mockTab.id);

    // testing else paths
    setConfig.resetHistory();
    // @ts-ignore
    await setAuthToken();
    expect(setConfig.notCalled).to.be.true;
    await checkTab(mockTab.id);

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
            regexFilter: '^https://admin.hlx.page/(config/test.json|[a-z]+/test/.*)',
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
            regexFilter: '^https://[0-9a-z-]+--[0-9a-z-]+--test.aem.(live|page)/.*',
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
    const setConfig = sandbox.spy(chrome.storage.session, 'set');
    const owner = 'test';
    const repo = 'site';
    const authToken = '1234567890';

    sandbox.stub(chrome.storage.sync, 'get').resolves({
      projects: [
        'test/site',
      ],
      'test/site': {
        owner,
        repo,
        host: 'production-host.com',
        previewHost: 'custom-preview.com',
        liveHost: 'custom-live.com',
      },
    });

    const mockTab = { id: 1234, url: 'https://production-host.com' };
    sandbox.stub(chrome.tabs, 'query')
      .withArgs({ active: true, currentWindow: true })
      .resolves([mockTab]);

    sandbox.stub(chrome.tabs, 'get')
      .withArgs(mockTab.id)
      .resolves(mockTab);

    await setAuthToken(owner, repo, authToken);
    expect(setConfig.callCount).to.equal(1);
    await checkTab(mockTab.id);

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
            regexFilter: '^https://admin.hlx.page/(config/test.json|[a-z]+/test/.*)',
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
            regexFilter: '^https://[0-9a-z-]+--[0-9a-z-]+--test.aem.(live|page)/.*',
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
    const setConfig = sandbox.spy(chrome.storage.session, 'set');
    const owner = 'test';
    const repo = 'site';
    const authToken = '1234567890';
    const siteToken = '0987654321';
    let expiry = Date.now() / 1000 + 60;

    const mockTab = { id: 1234, url: 'https://main--site--test.aem.live' };
    sandbox.stub(chrome.tabs, 'query')
      .withArgs({ active: true, currentWindow: true })
      .resolves([mockTab]);

    sandbox.stub(chrome.tabs, 'get')
      .withArgs(mockTab.id)
      .resolves(mockTab);

    await setAuthToken(owner, repo, authToken, expiry, siteToken, expiry);
    expect(setConfig.callCount).to.equal(1);
    await checkTab(mockTab.id);

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
            regexFilter: '^https://admin.hlx.page/(config/test.json|[a-z]+/test/.*)',
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
            regexFilter: '^https://[0-9a-z-]+--[0-9a-z-]+--test.aem.(live|page)/.*',
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
            regexFilter: '^https://[a-z0-9-]+--site--test.aem.(page|live)/.*',
            requestMethods: [
              'get',
              'post',
            ],
            resourceTypes: [
              'main_frame',
              'script',
              'stylesheet',
              'image',
              'xmlhttprequest',
              'media',
              'font',
            ],
          },
        },
      ],
    },
    )).to.be.true;

    // update existing auth and site tokens
    expiry = Date.now() / 1000 + 120;
    await setAuthToken(owner, repo, authToken, expiry, siteToken, expiry);
    await checkTab(mockTab.id);
    expect(setConfig.callCount).to.equal(2);
    expect(updateSessionRules.callCount).to.equal(4);

    // remove existing auth and site tokens
    await setAuthToken(owner, repo, '', undefined, '', undefined);
    await checkTab(mockTab.id);

    expect(setConfig.callCount).to.equal(3);
    expect(updateSessionRules.callCount).to.equal(5);
  });
});
