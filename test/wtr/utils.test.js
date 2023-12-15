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
  loadScript,
  getConfigMatches,
  isValidHost,
  getConfig,
  setConfig,
  removeConfig,
  clearConfig,
  getDisplay,
  setDisplay,
  toggleDisplay,
} from '../../src/extension/utils.js';

const CONFIGS = [
  {
    owner: 'foo',
    repo: 'bar1',
    ref: 'main',
    host: '1.foo.bar',
    mountpoints: ['https://foo.sharepoint.com/sites/foo/Shared%20Documents/root1'],
  },
  {
    owner: 'foo',
    repo: 'bar2',
    ref: 'main',
    host: '2.foo.bar',
    mountpoints: ['https://foo.sharepoint.com/sites/foo/Shared%20Documents/root2'],
    disabled: true,
  },
  {
    owner: 'foo',
    repo: 'bar3',
    ref: 'main',
    host: '3.foo.bar',
    mountpoints: ['https://foo.sharepoint.com/something/boo/Shared%20Documents/root3'],
  },
  {
    owner: 'foo',
    repo: 'bar4',
    ref: 'main',
    host: '4.foo.bar',
    mountpoints: ['https://drive.google.com/drive/folders/1234567890'],
  },
  {
    owner: 'foo',
    repo: 'bar5',
    ref: 'main',
    host: '5.foo.bar',
    mountpoints: ['https://foo.custom/sites/foo/Shared%20Documents/root1'],
  },
  {
    owner: 'foo',
    repo: 'bar6',
    ref: 'main',
    previewHost: '6-preview.foo.bar',
    liveHost: '6-live.foo.bar',
    host: '6.foo.bar',
    mountpoints: ['https://foo.sharepoint.com/sites/foo/Shared%20Documents/root1'],
  },
];

window.chrome = chromeMock;

describe('Test utils', () => {
  const sandbox = sinon.createSandbox();

  before(async () => {
    await setUserAgent('HeadlessChrome');
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('loadScript', async () => {
    const spy = sandbox.spy(document, 'querySelector');
    await loadScript('dummy.js');
    expect(spy.calledWith('.foo')).to.be.true;
  });

  it('isValidHost', () => {
    expect(isValidHost('https://main--bar--foo.hlx.page', 'foo', 'bar')).to.be.true;
    expect(isValidHost('https://main--bar--foo.hlx.live', 'foo', 'bar')).to.be.true;
    expect(isValidHost('https://main--bar--foo.aem.page', 'foo', 'bar')).to.be.true;
    expect(isValidHost('https://main--bar--foo.aem.live', 'foo', 'bar')).to.be.true;
    expect(isValidHost('https://main--bar--fake.hlx.live', 'foo', 'bar')).to.be.false;
    expect(isValidHost('https://main--bar--foo.hlx.random', 'foo', 'bar')).to.be.false;
    // check without owner & repo
    expect(isValidHost('https://main--bar--foo.hlx.page')).to.be.true;
  });

  it('getConfigMatches', async () => {
    // match preview URL
    expect((await getConfigMatches(CONFIGS, 'https://main--bar1--foo.hlx.page/')).length).to.equal(1);
    // match preview URL with any ref
    expect((await getConfigMatches(CONFIGS, 'https://baz--bar1--foo.hlx.page/')).length).to.equal(1);
    // match custom preview URL
    expect((await getConfigMatches(CONFIGS, 'https://6-preview.foo.bar/')).length).to.equal(1);
    // match live URL
    expect((await getConfigMatches(CONFIGS, 'https://main--bar1--foo.hlx.live/')).length).to.equal(1);
    // match custom live URL
    expect((await getConfigMatches(CONFIGS, 'https://6-live.foo.bar/')).length).to.equal(1);
    // match production host
    expect((await getConfigMatches(CONFIGS, 'https://1.foo.bar/')).length).to.equal(1);
    // ignore disabled config
    expect((await getConfigMatches(CONFIGS, 'https://main--bar2--foo.hlx.live/')).length).to.equal(0);
    // match transient URL
    expect((await getConfigMatches(CONFIGS, 'https://main--bar0--foo.hlx.live/')).length).to.equal(1);
    // todo: match sharepoint URL (docx)
    // expect((await getConfigMatches(CONFIGS, 'https://foo.sharepoint.com/:w:/r/sites/foo/_layouts/15/Doc.aspx?sourcedoc=%7BBFD9A19C-4A68-4DBF-8641-DA2F1283C895%7D&file=index.docx&action=default&mobileredirect=true')).length).to.equal(1);
    // todo: match gdrive URL
    // expect((await getConfigMatches(CONFIGS, 'https://docs.google.com/document/d/1234567890/edit')).length).to.equal(1);
  });

  it('getConfig', async () => {
    const spy = sandbox.spy(window.chrome.storage.local, 'get');
    await getConfig('local', 'test');
    expect(spy.calledWith('test')).to.be.true;
  });

  it('setConfig', async () => {
    const spy = sandbox.spy(window.chrome.storage.local, 'set');
    const obj = { foo: 'bar' };
    await setConfig('local', obj);
    expect(spy.calledWith(obj)).to.be.true;
  });

  it('removeConfig', async () => {
    const spy = sandbox.spy(window.chrome.storage.local, 'remove');
    await removeConfig('local', 'foo');
    expect(spy.calledWith('foo')).to.be.true;
  });

  it('clearConfig', async () => {
    const spy = sandbox.spy(window.chrome.storage.local, 'clear');
    await clearConfig('local');
    expect(spy.called).to.be.true;
  });

  it('getDisplay', async () => {
    const spy = sandbox.spy(window.chrome.storage.local, 'get');
    await getDisplay();
    expect(spy.calledWith('hlxSidekickDisplay')).to.be.true;
  });

  it('setDisplay', async () => {
    const spy = sandbox.spy(window.chrome.storage.local, 'set');
    await setDisplay(true);
    expect(spy.calledWith({
      hlxSidekickDisplay: true,
    })).to.be.true;
  });

  it('toggleDisplay', async () => {
    const spy = sandbox.spy(window.chrome.storage.local, 'set');
    const display = await toggleDisplay();
    expect(spy.calledWith({
      hlxSidekickDisplay: false,
    })).to.be.true;
    expect(display).to.be.false;
  });
});
