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

import { externalActions } from '../../src/extension/actions.js';
import chromeMock from './mocks/chrome.js';

// @ts-ignore
window.chrome = chromeMock;

describe('Test actions', () => {
  const sandbox = sinon.createSandbox();

  before(async () => {
    await setUserAgent('HeadlessChrome');
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('external: updateAuthToken', async () => {
    const setConfig = sandbox.spy(chrome.storage.session, 'set');
    const owner = 'test';
    const repo = 'project';
    const authToken = '1234567890';
    const exp = Date.now() / 1000 + 60;
    // from admin API
    let resp = await externalActions.updateAuthToken(
      {
        owner, repo, authToken, exp,
      },
      { url: 'https://admin.hlx.page/auth/test/project/main' },
    );
    expect(setConfig.called).to.be.true;
    expect(resp).to.equal('close');
    // from unauthorized url
    resp = await externalActions.updateAuthToken(
      {
        owner, repo, authToken, exp,
      },
      { url: 'https://admin.hlx.fake/' },
    );
    expect(resp).to.equal('unauthorized sender url');
    // error handling
    window.URL = class URLMock {
      constructor() {
        throw new Error('this is just a test');
      }
    };
    resp = await externalActions.updateAuthToken(
      {
        owner, repo, authToken, exp,
      },
      { url: 'https://admin.hlx.page/auth/test/project/main' },
    );
    expect(resp).to.equal('invalid message');
  });
});
