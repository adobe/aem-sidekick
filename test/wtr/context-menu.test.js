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

window.chrome = chromeMock;

const { updateContextMenu } = await import('../../src/extension/context-menu.js');

describe('Test context-menu', () => {
  const sandbox = sinon.createSandbox();

  before(async () => {
    await setUserAgent('HeadlessChrome');
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('updateContextMenu', async () => {
    const removeAll = sandbox.spy(chrome.contextMenus, 'removeAll');
    const create = sandbox.spy(chrome.contextMenus, 'create');
    const config = {
      owner: 'foo',
      repo: 'bar',
    };
    // unknown project
    await updateContextMenu({
      id: 0,
      url: 'https://main--bar--foo.hlx.page/',
      config,
    });
    expect(removeAll.calledOnce).to.be.true;
    expect(create.calledOnce).to.be.true;
    // project disabled
    await addProject(config);
    const project = await getProject(config);
    await updateProject({ ...project, disabled: true });
    // no config
    await updateContextMenu({
      id: 0,
      url: 'https://main--bar--foo.hlx.page/',
    });
    expect(removeAll.calledTwice).to.be.true;
    // not implemented
    removeAll.resetHistory();
    delete chrome.contextMenus;
    await updateContextMenu({});
    expect(removeAll.called).to.be.false;
  });
});
