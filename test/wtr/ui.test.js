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
import { addProject, getProject, updateProject } from '../../src/extension/project.js';
import { internalActions } from '../../src/extension/actions.js';

// @ts-ignore
window.chrome = chromeMock;

// prep listener test before importing ui.js
const openPreview = sinon.spy(internalActions, 'openPreview');
sinon.replace(chrome.contextMenus.onClicked, 'addListener', async (func) => {
  // @ts-ignore
  func({
    menuItemId: 'openPreview',
  }, {
    id: 1,
    url: 'https://main--blog--adobe.hlx.page/',
  });
});

const { updateContextMenu } = await import('../../src/extension/ui.js');

describe('Test context-menu', () => {
  const sandbox = sinon.createSandbox();

  before(async () => {
    await setUserAgent('HeadlessChrome');
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('click listener invokes action', async () => {
    expect(openPreview.called).to.be.true;
  });

  it('updateContextMenu', async () => {
    const removeAll = sandbox.spy(chrome.contextMenus, 'removeAll');
    const create = sandbox.spy(chrome.contextMenus, 'create');
    const config = {
      owner: 'foo',
      repo: 'bar',
      ref: 'main',
    };

    // project not added yet (remove all and add 1)
    await updateContextMenu({
      url: 'https://main--bar--foo.hlx.page/',
      config,
    });
    expect(removeAll.callCount).to.equal(1);
    expect(create.callCount).to.equal(1);

    // project added (remove all and add 3)
    await addProject(config);
    const project = await getProject(config);
    await updateContextMenu({
      url: 'https://main--bar--foo.hlx.page/',
      config,
    });
    expect(removeAll.callCount).to.equal(2);
    expect(create.callCount).to.equal(4);

    // project disabled (remove all and add 3)
    await updateProject({ ...project, disabled: true });
    await updateContextMenu({
      url: 'https://main--bar--foo.hlx.page/',
      config,
    });
    expect(removeAll.callCount).to.equal(3);
    expect(create.callCount).to.equal(7);

    // no config (remove all and add 0)
    await updateContextMenu({
      url: 'https://main--bar--foo.hlx.page/',
    });
    expect(removeAll.callCount).to.equal(4);
    expect(create.callCount).to.equal(7);

    // chrome.contextMenus not implemented
    removeAll.resetHistory();
    const originalContextMenus = chrome.contextMenus;
    delete chrome.contextMenus;
    // @ts-ignore
    await updateContextMenu({});
    expect(removeAll.called).to.be.false;
    chrome.contextMenus = originalContextMenus;
  });
});
