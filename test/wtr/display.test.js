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
  getDisplay,
  setDisplay,
  toggleDisplay,
} from '../../src/extension/display.js';

// @ts-ignore
window.chrome = chromeMock;

describe('Test display', () => {
  const sandbox = sinon.createSandbox();

  before(async () => {
    await setUserAgent('HeadlessChrome');
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('getDisplay', async () => {
    const spy = sandbox.spy(chrome.storage.local, 'get');
    await getDisplay();
    expect(spy.calledWith('display')).to.be.true;
  });

  it('setDisplay', async () => {
    const spy = sandbox.spy(chrome.storage.local, 'set');
    await setDisplay(true);
    expect(spy.calledWith({
      display: true,
    })).to.be.true;
  });

  it('toggleDisplay', async () => {
    const spy = sandbox.spy(chrome.storage.local, 'set');
    const display = await toggleDisplay();
    expect(spy.calledWith({
      display: false,
    })).to.be.true;
    expect(display).to.be.false;
  });
});
