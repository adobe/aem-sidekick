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

import { externalActions, internalActions } from '../../src/extension/actions.js';
import chromeMock from './mocks/chrome.js';
import { error } from './test-utils.js';

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
    const set = sandbox.spy(chrome.storage.session, 'set');
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
    expect(set.called).to.be.true;
    expect(resp).to.equal('close');
    // from unauthorized url
    resp = await externalActions.updateAuthToken(
      {
        owner, repo, authToken, exp,
      },
      { url: 'https://admin.hlx.fake/' },
    );
    expect(resp).to.equal('invalid message');
    // error handling
    sandbox.stub(window, 'URL').throws(error);
    resp = await externalActions.updateAuthToken(
      {
        owner, repo, authToken, exp,
      },
      { url: 'https://admin.hlx.page/auth/test/project/main' },
    );
    expect(resp).to.equal('invalid message');
    // testing noops
    set.resetHistory();
    await externalActions.updateAuthToken(
      { owner, repo },
      { url: 'https://admin.hlx.page/auth/test/project/main' },
    );
    await externalActions.updateAuthToken(
      {
        owner, repo, authToken, exp,
      },
      { url: 'https://some.malicious.actor/' },
    );
    await externalActions.updateAuthToken({}, {});
    expect(set.notCalled).to.be.true;
  });

  it('internal: addRemoveProject', async () => {
    const set = sandbox.spy(chrome.storage.sync, 'set');
    const remove = sandbox.spy(chrome.storage.sync, 'remove');
    const reload = sandbox.spy(chrome.tabs, 'reload');
    // add project
    await internalActions.addRemoveProject({
      id: 1,
      url: 'https://main--bar--foo.hlx.page/',
    });
    expect(set.calledWith({
      projects: ['foo/bar'],
    })).to.be.true;
    expect(set.calledWith({
      'foo/bar': {
        id: 'foo/bar/main',
        giturl: 'https://github.com/foo/bar/tree/main',
        owner: 'foo',
        repo: 'bar',
        ref: 'main',
      },
    })).to.be.true;
    expect(reload.calledWith(1)).to.be.true;
    // remove project
    await internalActions.addRemoveProject({
      id: 2,
      url: 'https://main--bar--foo.hlx.page/',
    });
    expect(set.calledWith(
      { projects: [] },
    )).to.be.true;
    expect(remove.calledWith('foo/bar')).to.be.true;
    expect(reload.calledWith(2)).to.be.true;
    // testing noop
    set.resetHistory();
    await internalActions.addRemoveProject({
      id: 1,
      url: 'https://www.example.com/',
    });
    expect(set.notCalled).to.be.true;
  });

  it('internal: enableDisableProject', async () => {
    const set = sandbox.spy(chrome.storage.sync, 'set');
    const reload = sandbox.spy(chrome.tabs, 'reload');
    // add project first
    await internalActions.addRemoveProject({
      id: 1,
      url: 'https://main--bar--foo.hlx.page/',
    });
    // disable project
    await internalActions.enableDisableProject({
      id: 1,
      url: 'https://main--bar--foo.hlx.page/',
    });
    expect(set.calledWith({
      'foo/bar': {
        id: 'foo/bar/main',
        giturl: 'https://github.com/foo/bar/tree/main',
        owner: 'foo',
        repo: 'bar',
        ref: 'main',
        disabled: true,
      },
    })).to.be.true;
    expect(reload.calledWith(1)).to.be.true;
    // enable project
    await internalActions.enableDisableProject({
      id: 2,
      url: 'https://main--bar--foo.hlx.page/',
    });
    expect(set.calledWith({
      'foo/bar': {
        id: 'foo/bar/main',
        giturl: 'https://github.com/foo/bar/tree/main',
        owner: 'foo',
        repo: 'bar',
        ref: 'main',
      },
    })).to.be.true;
    expect(reload.calledWith(2)).to.be.true;
    // testing noop
    set.resetHistory();
    await internalActions.enableDisableProject({
      id: 1,
      url: 'https://www.example.com/',
    });
    expect(set.notCalled).to.be.true;
  });

  it('internal: openPreview', async () => {
    const create = sandbox.spy(chrome.tabs, 'create');
    await internalActions.openPreview({
      id: 1,
      url: 'https://github.com/adobe/blog',
    });
    expect(create.calledWith({
      url: 'https://main--blog--adobe.hlx.page/',
    })).to.be.true;
    // open preview with unsupported url
    create.resetHistory();
    await internalActions.openPreview({
      id: 1,
      url: 'https://www.example.com',
    });
    expect(create.called).to.be.false;
  });
});
