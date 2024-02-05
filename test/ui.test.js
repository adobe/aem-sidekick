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

import { expect } from '@open-wc/testing';
import { setUserAgent } from '@web/test-runner-commands';
import sinon from 'sinon';

import chromeMock from './mocks/chrome.js';
import { addProject, getProject, updateProject } from '../src/extension/project.js';
import { internalActions } from '../src/extension/actions.js';
import { setDisplay } from '../src/extension/display.js';
import { error } from './test-utils.js';

// @ts-ignore
window.chrome = chromeMock;

// prep listener test before importing ui.js
const openPreviewSpy = sinon.spy(internalActions, 'openPreview');
sinon.replace(chrome.contextMenus.onClicked, 'addListener', async (func) => {
  // @ts-ignore
  func({
    menuItemId: 'openPreview',
  }, {
    id: 1,
    url: 'https://main--blog--adobe.hlx.page/',
  });
});

const { updateContextMenu, updateIcon } = await import('../src/extension/ui.js');

const sandbox = sinon.createSandbox();
const config = {
  owner: 'foo',
  repo: 'bar',
  ref: 'main',
  mountpoints: [],
};

describe('Test UI: updateContextMenu', () => {
  let createSpy;
  let removeAllSpy;
  let addListenerStub;

  before(async () => {
    await setUserAgent('HeadlessChrome');
  });

  beforeEach(async () => {
    removeAllSpy = sandbox.spy(chrome.contextMenus, 'removeAll');
    createSpy = sandbox.spy(chrome.contextMenus, 'create');
    addListenerStub = sandbox.stub(chrome.runtime.onMessage, 'addListener')
      .callsFake((func, _) => func(
        { isAEM: true },
        { tab: { id: 1 } },
      ));
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('click listener invokes action', async () => {
    expect(openPreviewSpy.called).to.be.true;
  });

  it('updateContextMenu: project not added yet', async () => {
    await updateContextMenu({
      url: 'https://main--bar--foo.hlx.page/',
      config,
    });
    expect(removeAllSpy.callCount).to.equal(1);
    expect(createSpy.callCount).to.equal(2);
    expect(createSpy.calledWithMatch({ id: 'addRemoveProject' })).to.be.true;
    expect(createSpy.calledWithMatch({ id: 'openViewDocSource' })).to.be.true;
  });

  it('updateContextMenu: project added and enabled', async () => {
    await addProject(config);
    await updateContextMenu({
      url: 'https://main--bar--foo.hlx.page/',
      config,
    });
    expect(removeAllSpy.callCount).to.equal(1);
    expect(createSpy.callCount).to.equal(4);
    expect(createSpy.calledWithMatch({ id: 'enableDisableProject' })).to.be.true;
    expect(createSpy.calledWithMatch({ id: 'openPreview' })).to.be.true;
  });

  it('updateContextMenu: project added and disabled', async () => {
    const project = await getProject(config);
    await updateProject({ ...project, disabled: true });
    await updateContextMenu({
      url: 'https://main--bar--foo.hlx.page/',
      config,
    });
    expect(removeAllSpy.callCount).to.equal(1);
    expect(createSpy.callCount).to.equal(4);
  });

  it('updateContextMenu: no matching config', async () => {
    await updateContextMenu({
      url: 'https://main--bar--foo.hlx.page/',
    });
    expect(removeAllSpy.callCount).to.equal(1);
    expect(createSpy.callCount).to.equal(0);
  });

  it('updateContextMenu: chrome.contextMenus API missing', async () => {
    const originalContextMenus = chrome.contextMenus;
    delete chrome.contextMenus;
    // @ts-ignore
    await updateContextMenu({});
    expect(removeAllSpy.callCount).to.equal(0);
    chrome.contextMenus = originalContextMenus;
  });

  it('updateContextMenu: project added but not an AEM site', async () => {
    addListenerStub.restore();
    addListenerStub = sandbox.stub(chrome.runtime.onMessage, 'addListener')
      .callsFake((func, _) => func(
        { isAEM: false },
        { tab: { id: 1 } },
      ));
    await updateContextMenu({
      url: 'https://main--bar--foo.hlx.page/',
      config,
    });
    expect(removeAllSpy.callCount).to.equal(1);
    expect(createSpy.callCount).to.equal(3);
    expect(createSpy.calledWithMatch({ id: 'openViewDocSource' })).to.be.false;
  });

  it('updateContextMenu: guessAEMSite fails', async () => {
    // addListenerStub.restore();
    sandbox.stub(chrome.scripting, 'executeScript')
      .throws(error);
    await updateContextMenu({
      url: 'https://main--bar--foo.hlx.page/',
      config,
    });
    expect(removeAllSpy.callCount).to.equal(1);
    expect(createSpy.callCount).to.equal(3);
    expect(createSpy.calledWithMatch({ id: 'openViewDocSource' })).to.be.false;
  });
});

describe('Test UI: updateIcon', () => {
  let setIconSpy;

  before(async () => {
    await setUserAgent('HeadlessChrome');
  });

  beforeEach(async () => {
    setIconSpy = sandbox.spy(chrome.action, 'setIcon');
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('updateIcon: disabled', async () => {
    // disabled
    await updateIcon({});
    expect(setIconSpy.calledWith({
      path: {
        16: 'icons/disabled/icon-16x16.png',
        32: 'icons/disabled/icon-32x32.png',
        48: 'icons/disabled/icon-48x48.png',
        128: 'icons/disabled/icon-128x128.png',
        512: 'icons/disabled/icon-512x512.png',
      },
    })).to.be.true;
  });

  it('updateIcon: default', async () => {
    await setDisplay(true);
    await updateIcon({
      matches: [config],
    });
    expect(setIconSpy.calledWith({
      path: {
        16: 'icons/default/icon-16x16.png',
        32: 'icons/default/icon-32x32.png',
        48: 'icons/default/icon-48x48.png',
        128: 'icons/default/icon-128x128.png',
        512: 'icons/default/icon-512x512.png',
      },
    })).to.be.true;
  });

  it('updateIcon: hidden', async () => {
    // hidden
    await setDisplay(false);
    await updateIcon({
      matches: [config],
    });
    expect(setIconSpy.calledWith({
      path: {
        16: 'icons/hidden/icon-16x16.png',
        32: 'icons/hidden/icon-32x32.png',
        48: 'icons/hidden/icon-48x48.png',
        128: 'icons/hidden/icon-128x128.png',
        512: 'icons/hidden/icon-512x512.png',
      },
    })).to.be.true;
  });
});
