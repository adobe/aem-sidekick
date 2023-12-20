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
import {
  getConfig,
  setConfig,
  removeConfig,
  clearConfig,
} from '../../src/extension/config.js';

window.chrome = chromeMock;

describe('Test config', () => {
  const sandbox = sinon.createSandbox();

  before(async () => {
    await setUserAgent('HeadlessChrome');
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('getConfig', async () => {
    const spy = sandbox.spy(chrome.storage.local, 'get');
    await getConfig('local', 'test');
    expect(spy.calledWith('test')).to.be.true;
  });

  it('setConfig', async () => {
    const spy = sandbox.spy(chrome.storage.local, 'set');
    const obj = { foo: 'bar' };
    await setConfig('local', obj);
    expect(spy.calledWith(obj)).to.be.true;
  });

  it('removeConfig', async () => {
    const spy = sandbox.spy(chrome.storage.local, 'remove');
    await removeConfig('local', 'foo');
    expect(spy.calledWith('foo')).to.be.true;
  });

  it('clearConfig', async () => {
    const spy = sandbox.spy(chrome.storage.local, 'clear');
    await clearConfig('local');
    expect(spy.called).to.be.true;
  });
});
