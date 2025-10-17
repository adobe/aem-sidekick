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

// @ts-ignore
import fetchMock from 'fetch-mock/esm/client.js';
import { expect } from '@open-wc/testing';
import { setUserAgent } from '@web/test-runner-commands';
import sinon from 'sinon';

import {
  checkViewDocSource,
  externalActions,
  internalActions,
  notificationConfirmCallback,
} from '../src/extension/actions.js';
import chromeMock from './mocks/chrome.js';
import { error, mockTab } from './test-utils.js';
import { log } from '../src/extension/log.js';
import {
  PIPELINE_HTML,
  PIPELINE_JSON,
  RANDOM_HTML,
  RANDOM_JSON,
} from './fixtures/payloads.js';
import { urlCache } from '../src/extension/url-cache.js';

// @ts-ignore
window.chrome = chromeMock;

const CONFIGS = [{
  owner: 'foo',
  repo: 'bar1',
  ref: 'main',
  host: '1.foo.bar',
  mountpoints: ['https://foo.sharepoint.com/sites/foo/Shared%20Documents/root1'],
}, {
  owner: 'foo',
  repo: 'bar2',
  ref: 'main',
  host: '2.foo.bar',
  mountpoints: ['https://foo.sharepoint.com/sites/foo/Shared%20Documents/root2'],
  disabled: true,
}];

describe('Test actions', () => {
  const sandbox = sinon.createSandbox();

  before(async () => {
    await setUserAgent('HeadlessChrome');
  });

  afterEach(() => {
    sandbox.restore();
    fetchMock.restore();
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
      { tab: mockTab('https://admin.hlx.page/auth/test/project/main') },
    );
    expect(set.called).to.be.true;
    expect(resp).to.equal('close');

    // from unauthorized url
    resp = await externalActions.updateAuthToken(
      {
        owner, repo, authToken, exp,
      },
      { tab: mockTab('https://admin.hlx.fake/') },
    );
    expect(resp).to.equal('invalid message');

    // error handling
    const urlStub = sandbox.stub(window, 'URL').throws(error);
    resp = await externalActions.updateAuthToken(
      {
        owner, repo, authToken, exp,
      },
      { tab: mockTab('https://admin.hlx.page/auth/test/project/main') },
    );
    expect(resp).to.equal('invalid message');
    urlStub.restore();

    // testing noops
    set.resetHistory();
    await externalActions.updateAuthToken(
      { owner, repo },
      { tab: mockTab('https://admin.hlx.page/auth/test/project/main') },
    );
    await externalActions.updateAuthToken(
      {
        owner, repo, authToken, exp,
      },
      { tab: mockTab('https://some.malicious.actor/') },
    );
    await externalActions.updateAuthToken(
      {},
      { tab: {} },
    );
    expect(set.notCalled).to.be.true;
  });

  it('external: getAuthInfo', async () => {
    const getStub = sandbox.stub(chrome.storage.session, 'get');
    let resp;

    // without auth info
    getStub.resolves({});
    resp = await externalActions.getAuthInfo({}, { tab: mockTab('https://tools.aem.live') });
    expect(resp).to.deep.equal([]);

    // with auth info
    getStub.resolves({
      projects: [{
        // valid auth token, include
        owner: 'foo',
        repo: 'bar',
        authToken: '1234567890',
        authTokenExpiry: Date.now() + 60000,
      }, {
        // expired auth token, exclude
        owner: 'foo2',
        repo: 'baz',
        authToken: '1234567890',
        authTokenExpiry: Date.now() - 60000,
      }, {
        // no auth token, exclude
        owner: 'foo1',
        repo: 'baz',
      }],
    });

    // trusted actors
    resp = await externalActions.getAuthInfo({}, { tab: mockTab('https://tools.aem.live/') });
    expect(resp).to.deep.equal(['foo']);

    resp = await externalActions.getAuthInfo({}, { tab: mockTab('https://tools.aem.live/test') });
    expect(resp).to.deep.equal(['foo']);

    resp = await externalActions.getAuthInfo({}, { tab: mockTab('https://feature--helix-labs-website--adobe.aem.page/feature') });
    expect(resp).to.deep.equal(['foo']);

    // untrusted actors
    resp = await externalActions.getAuthInfo({}, { tab: mockTab('https://evil.live') });
    expect(resp).to.deep.equal([]);

    resp = await externalActions.getAuthInfo({}, { tab: mockTab('https://main--site--owner.aem.live') });
    expect(resp).to.deep.equal([]);

    resp = await externalActions.getAuthInfo({}, { tab: mockTab('https://tools.aem.live.evil.com') });
    expect(resp).to.deep.equal([]);

    resp = await externalActions.getAuthInfo({}, { tab: mockTab('https://main--helix-tools-website--adobe.aem.live.evil.com') });
    expect(resp).to.deep.equal([]);
  });

  it('external: getSites', async () => {
    const getStub = sandbox.stub(chrome.storage.sync, 'get');
    const projects = [
      'foo/bar',
      'foo1/baz',
      'foo2/baz',
    ];
    const projectConfigs = [
      { org: 'foo', site: 'bar', project: 'Foo Bar' },
      { org: 'foo1', site: 'baz', host: 'foo1.baz' },
      { owner: 'foo2', repo: 'baz', host: 'foo2.baz' },
    ];
    const expectedOutput = [
      {
        org: 'foo', site: 'bar', project: 'Foo Bar',
      },
      {
        org: 'foo1', site: 'baz', host: 'foo1.baz',
      },
      {
        org: 'foo2', site: 'baz', owner: 'foo2', repo: 'baz', host: 'foo2.baz',
      },
    ];

    let resp;

    // without projects
    getStub.resolves({});
    resp = await externalActions.getSites({}, { tab: mockTab('https://tools.aem.live') });
    expect(resp).to.deep.equal([]);

    // with projects
    getStub.resolves({
      projects,
    });
    projects.forEach((handle, i) => {
      getStub.withArgs(handle).resolves({
        [handle]: projectConfigs[i],
      });
    });

    // trusted actors
    resp = await externalActions.getSites({}, { tab: mockTab('https://tools.aem.live/foo') });
    expect(resp).to.deep.equal(expectedOutput);

    resp = await externalActions.getSites({}, { tab: mockTab('https://labs.aem.live/foo') });
    expect(resp).to.deep.equal(expectedOutput);

    resp = await externalActions.getSites({}, { tab: mockTab('https://feature--helix-labs-website--adobe.aem.page/feature') });
    expect(resp).to.deep.equal(expectedOutput);

    // untrusted actors
    resp = await externalActions.getSites({}, { tab: mockTab('https://evil.live') });
    expect(resp).to.deep.equal([]);

    resp = await externalActions.getSites({}, { tab: mockTab('https://main--site--owner.aem.live') });
    expect(resp).to.deep.equal([]);

    resp = await externalActions.getSites({}, { tab: mockTab('https://tools.aem.live.evil.com') });
    expect(resp).to.deep.equal([]);

    resp = await externalActions.getSites({}, { tab: mockTab('https://main--helix-tools-website--adobe-evl.aem.live') });
    expect(resp).to.deep.equal([]);
  });

  it('external: addSite', async () => {
    const addConfig = { owner: 'foo', repo: 'bar' };

    const resultingConfig = {
      ...addConfig,
      contentSourceUrl: 'https://foo.bar/content/source',
      previewHost: 'https://preview.foo.bar',
      liveHost: 'https://live.foo.bar',
      reviewHost: 'https://review.foo.bar',
      host: 'https://foo.bar',
      project: 'Foo Bar',
    };

    const getStub = sandbox.stub(chrome.storage.sync, 'get');
    const setStub = sandbox.stub(chrome.storage.sync, 'set');
    getStub.withArgs('projects').resolves({
      projects: [],
    });
    fetchMock.get('glob:https://admin.hlx.page/sidekick/**/main/config.json', {
      status: 200,
      body: resultingConfig,
    });

    let resp;

    // trusted actor
    resp = await externalActions.addSite({
      config: addConfig,
    }, { tab: mockTab('https://tools.aem.live/foo') });
    expect(setStub.called).to.be.true;
    expect(setStub.calledWith({ projects: ['foo/bar'] })).to.be.true;
    expect(setStub.calledWithMatch({
      'foo/bar': {
        previewHost: 'https://preview.foo.bar',
      },
    })).to.be.true;
    expect(resp).to.be.true;

    // trusted actor with org and site
    resp = await externalActions.addSite({
      config: { org: addConfig.owner, site: addConfig.repo },
    }, { tab: mockTab('https://tools.aem.live/foo') });
    expect(setStub.calledWith({ projects: ['foo/bar'] })).to.be.true;
    expect(resp).to.be.true;

    // trusted actor with idp and tenant
    resp = await externalActions.addSite({
      config: { org: 'foo', site: 'baz' },
      idp: 'microsoft',
      tenant: 'common',
    }, { tab: mockTab('https://tools.aem.live/foo') });
    expect(setStub.calledWith({ projects: ['foo/bar', 'foo/baz'] })).to.be.true;
    expect(resp).to.be.true;

    setStub.resetHistory();

    // trusted actor with missing owner and repo
    resp = await externalActions.addSite({
      config: { project: 'Foo Baz' },
    }, { tab: mockTab('https://tools.aem.live/foo') });
    expect(setStub.called).to.be.false;
    expect(resp).to.be.false;

    // untrusted actor
    resp = await externalActions.addSite({
      config: addConfig,
    }, { tab: mockTab('https://evil.live') });
    expect(setStub.called).to.be.false;
    expect(resp).to.be.false;
  });

  it('external: updateSite', async () => {
    const oldConfig = { owner: 'foo', repo: 'bar', project: 'Foo Bar' };
    const newConfig = { owner: 'foo', repo: 'bar', project: 'New Foo Bar' };

    const getStub = sandbox.stub(chrome.storage.sync, 'get');
    const setStub = sandbox.stub(chrome.storage.sync, 'set');
    getStub.withArgs('projects').resolves({
      projects: ['foo/bar'],
    });
    getStub.withArgs('foo/bar').resolves({
      'foo/bar': oldConfig,
    });

    let resp;

    // trusted actor
    resp = await externalActions.updateSite({
      config: newConfig,
    }, { tab: mockTab('https://tools.aem.live/foo') });
    expect(setStub.calledWith({ 'foo/bar': newConfig })).to.be.true;
    expect(resp).to.be.true;

    setStub.resetHistory();

    // trusted actor with unknown site
    resp = await externalActions.updateSite({
      config: { owner: 'foo', repo: 'baz', project: 'Foo Baz' },
    }, { tab: mockTab('https://tools.aem.live/foo') });
    expect(setStub.called).to.be.false;
    expect(resp).to.be.false;

    // trusted actor with missing owner and repo
    resp = await externalActions.updateSite({
      config: { project: 'Foo Baz' },
    }, { tab: mockTab('https://tools.aem.live/foo') });
    expect(setStub.called).to.be.false;
    expect(resp).to.be.false;

    // untrusted actor
    resp = await externalActions.updateSite({
      config: newConfig,
    }, { tab: mockTab('https://evil.live') });
    expect(setStub.called).to.be.false;
    expect(resp).to.be.false;
  });

  it('external: removeSite', async () => {
    const config1 = { owner: 'foo', repo: 'bar', project: 'Foo Bar' };
    const config2 = { org: 'foo', site: 'baz' };

    const getStub = sandbox.stub(chrome.storage.sync, 'get');
    const removeStub = sandbox.stub(chrome.storage.sync, 'remove');
    const setStub = sandbox.stub(chrome.storage.sync, 'set');
    getStub.withArgs('projects').resolves({
      projects: ['foo/bar', 'foo/baz'],
    });
    getStub.withArgs('foo/bar').resolves({
      'foo/bar': config1,
    });
    getStub.withArgs('foo/baz').resolves({
      'foo/baz': config2,
    });

    let resp;

    // trusted actor
    resp = await externalActions.removeSite({
      config: config1,
    }, { tab: mockTab('https://tools.aem.live/foo') });
    expect(removeStub.called).to.be.true;
    expect(setStub.calledWith({ projects: ['foo/baz'] })).to.be.true;
    expect(resp).to.be.true;

    // trusted actor with org and site
    resp = await externalActions.removeSite({
      config: config2,
    }, { tab: mockTab('https://tools.aem.live/foo') });
    expect(removeStub.called).to.be.true;
    expect(setStub.calledWith({ projects: [] })).to.be.true;
    expect(resp).to.be.true;

    removeStub.resetHistory();
    setStub.resetHistory();

    // trusted actor with missing owner and repo
    resp = await externalActions.removeSite({
      config: { project: 'Foo Baz' },
    }, { tab: mockTab('https://tools.aem.live/foo') });
    expect(removeStub.called).to.be.false;
    expect(setStub.called).to.be.false;
    expect(resp).to.be.false;

    // untrusted actor
    resp = await externalActions.removeSite({
      config: config1,
    }, { tab: mockTab('https://evil.live') });
    expect(removeStub.called).to.be.false;
    expect(setStub.called).to.be.false;
    expect(resp).to.be.false;
  });

  it('external: launch', async () => {
    const localStorageSetStub = sandbox.stub(chrome.storage.local, 'set');
    const urlCacheSetStub = sandbox.stub(urlCache, 'set');
    const logWarnSpy = sandbox.spy(log, 'warn');

    await externalActions.launch({ owner: 'foo', repo: 'bar' }, { tab: { tab: mockTab('https://foo.live/') } });
    expect(urlCacheSetStub.called).to.be.true;
    expect(localStorageSetStub.calledWith({ display: true })).to.be.true;

    sandbox.resetHistory();

    // missing mandatory parameters
    await externalActions.launch({}, { tab: mockTab('https://foo.live/') });
    expect(urlCacheSetStub.called).to.be.false;
    expect(localStorageSetStub.called).to.be.false;
    expect(logWarnSpy.calledWith('launch: missing required parameters org and site or owner and repo')).to.be.true;
  });

  it('external: login', async () => {
    const createTabStub = sandbox.stub(chrome.tabs, 'create');
    const removeTabStub = sandbox.stub(chrome.tabs, 'remove');
    const addListenerStub = sandbox.stub(chrome.runtime.onMessageExternal, 'addListener');
    createTabStub.callsFake(({ url }) => ({ id: 7, url }));
    addListenerStub.callsFake((listener) => {
      listener({
        action: 'updateAuthToken',
      }, {
        tab: mockTab('https://admin.hlx.page/login/foo/bar/main?extensionId=dummy', { id: 7 }),
      }, () => {});
    });
    let resp;

    // trusted actor
    resp = await externalActions.login(
      { org: 'foo', site: 'bar' },
      { tab: mockTab('https://tools.aem.live/tools/foo.html') },
    );
    expect(resp).to.be.true;
    expect(createTabStub.calledWith({
      url: 'https://admin.hlx.page/login/foo/bar/main?extensionId=dummy',
      openerTabId: 0,
      windowId: 0,
    })).to.be.true;
    expect(removeTabStub.called).to.be.true;

    sandbox.resetHistory();

    // trusted actor with selectAccount parameter
    resp = await externalActions.login(
      { org: 'foo', site: 'bar', selectAccount: true },
      { tab: mockTab('https://tools.aem.live/tools/foo.html') },
    );
    expect(resp).to.be.true;
    expect(createTabStub.calledWith({
      url: 'https://admin.hlx.page/login/foo/bar/main?extensionId=dummy&selectAccount=true',
      openerTabId: 0,
      windowId: 0,
    })).to.be.true;

    // trusted actor with idp parameter
    resp = await externalActions.login(
      { org: 'foo', site: 'bar', idp: 'microsoft' },
      { tab: mockTab('https://tools.aem.live/tools/foo.html') },
    );
    expect(resp).to.be.true;
    expect(createTabStub.calledWith({
      url: 'https://admin.hlx.page/login/foo/bar/main?extensionId=dummy&idp=microsoft',
      openerTabId: 0,
      windowId: 0,
    })).to.be.true;

    // trusted actor with idp and tenant parameter
    resp = await externalActions.login(
      {
        org: 'foo',
        site: 'bar',
        idp: 'microsoft',
        tenant: 'common',
      },
      { tab: mockTab('https://tools.aem.live/tools/foo.html') },
    );
    expect(resp).to.be.true;
    expect(createTabStub.calledWith({
      url: 'https://admin.hlx.page/login/foo/bar/main?extensionId=dummy&idp=microsoft&tenantId=common',
      openerTabId: 0,
      windowId: 0,
    })).to.be.true;

    // trusted actor with unsupported idp
    resp = await externalActions.login(
      { org: 'foo', site: 'bar', idp: 'foo' },
      { tab: mockTab('https://tools.aem.live/tools/foo.html') },
    );
    expect(resp).to.be.false;
    expect(createTabStub.calledWith({
      url: 'https://admin.hlx.page/login/foo/bar/main?extensionId=dummy&idp=foo',
      openerTabId: 0,
      windowId: 0,
    })).to.be.false;

    // missing mandatory parameters
    resp = await externalActions.login(
      {},
      { tab: mockTab('https://tools.aem.live/tools/foo.html') },
    );
    expect(resp).to.be.false;

    // untrusted actors
    await externalActions.login(
      { org: 'foo', site: 'bar' },
      { tab: mockTab('https://tools.aem.live.evil/tools/foo.html') },
    );
    expect(resp).to.be.false;

    // message from wrong tab
    addListenerStub.callsFake((listener) => {
      listener({
        action: 'somethingElse',
      }, {
        tab: mockTab('https://admin.hlx.page/login/foo/bar/main?extensionId=dummy', { id: 8 }),
      }, () => {});
    });
    resp = await externalActions.login(
      { org: 'foo', site: 'bar' },
      { tab: mockTab('https://tools.aem.live/tools/foo.html') },
    );
    expect(resp).to.be.false;
  });

  it('external: closePalette', async () => {
    const sendMessageStub = sandbox.stub(chrome.tabs, 'sendMessage');
    sendMessageStub.resolves();
    let resp;

    // successful close with specific ID
    resp = await externalActions.closePalette({ id: 'my-plugin' }, { tab: mockTab('https://main--bar--foo.hlx.page/', { id: 1 }) });
    expect(sendMessageStub.calledWith(1, { action: 'close_palette', id: 'my-plugin' })).to.be.true;
    expect(resp).to.be.true;

    sandbox.resetHistory();

    // no palette ID
    resp = await externalActions.closePalette({}, { tab: mockTab('https://main--bar--foo.hlx.page/', { id: 1 }) });
    expect(sendMessageStub.called).to.be.false;
    expect(resp).to.be.false;

    sandbox.resetHistory();

    // no tab id
    resp = await externalActions.closePalette({ id: 'my-plugin' }, { tab: {} });
    expect(sendMessageStub.called).to.be.false;
    expect(resp).to.be.false;

    sandbox.resetHistory();

    // error sending message
    sendMessageStub.rejects(error);
    resp = await externalActions.closePalette({ id: 'my-plugin' }, { tab: mockTab('https://main--bar--foo.hlx.page/', { id: 1 }) });
    expect(resp).to.be.false;
  });

  it('external: closePopover', async () => {
    const sendMessageStub = sandbox.stub(chrome.tabs, 'sendMessage');
    sendMessageStub.resolves();
    let resp;

    // successful close with specific ID
    resp = await externalActions.closePopover({ id: 'my-plugin' }, { tab: mockTab('https://main--bar--foo.hlx.page/', { id: 1 }) });
    expect(sendMessageStub.calledWith(1, { action: 'close_popover', id: 'my-plugin' })).to.be.true;
    expect(resp).to.be.true;

    sandbox.resetHistory();

    // no popover ID
    resp = await externalActions.closePopover({}, { tab: mockTab('https://main--bar--foo.hlx.page/', { id: 1 }) });
    expect(sendMessageStub.called).to.be.false;
    expect(resp).to.be.false;

    sandbox.resetHistory();

    // no tab id
    resp = await externalActions.closePopover({ id: 'my-plugin' }, { tab: {} });
    expect(sendMessageStub.called).to.be.false;
    expect(resp).to.be.false;

    sandbox.resetHistory();

    // error sending message
    sendMessageStub.rejects(error);
    resp = await externalActions.closePopover({ id: 'my-plugin' }, { tab: mockTab('https://main--bar--foo.hlx.page/', { id: 1 }) });
    expect(resp).to.be.false;
  });

  it('internal: addRemoveProject', async () => {
    const set = sandbox.spy(chrome.storage.sync, 'set');
    const remove = sandbox.spy(chrome.storage.sync, 'remove');
    const i18nSpy = sandbox.spy(chrome.i18n, 'getMessage');

    // add project
    await internalActions.addRemoveProject(mockTab('https://main--bar--foo.hlx.page/', {
      id: 1,
    }));
    expect(set.calledWith({
      projects: ['foo/bar'],
    })).to.be.true;
    expect(set.calledWith({
      'foo/bar': {
        id: 'foo/bar',
        giturl: 'https://github.com/foo/bar/tree/main',
        owner: 'foo',
        repo: 'bar',
        ref: 'main',
      },
    })).to.be.true;
    expect(i18nSpy.calledWith('config_project_added', 'foo/bar')).to.be.true;

    // remove project
    await internalActions.addRemoveProject({
      id: 2,
      url: 'https://main--bar--foo.hlx.page/',
    });
    expect(set.calledWith(
      { projects: [] },
    )).to.be.true;
    // @ts-ignore
    expect(remove.calledWith('foo/bar')).to.be.true;
    expect(i18nSpy.calledWith('config_project_removed', 'foo/bar')).to.be.true;

    // testing transient project
    sandbox.stub(urlCache, 'get').resolves([{
      owner: 'foo',
      repo: 'bar',
      originalSite: false,
    }]);
    await internalActions.addRemoveProject({
      id: 1,
      url: 'https://main--bar--foo.hlx.page/',
    });
    expect(set.calledWith({
      'foo/bar': {
        id: 'foo/bar',
        giturl: 'https://github.com/foo/bar/tree/main',
        owner: 'foo',
        repo: 'bar',
        ref: 'main',
      },
    })).to.be.true;

    // remove again
    await internalActions.addRemoveProject({
      id: 1,
      url: 'https://main--bar--foo.hlx.page/',
    });

    // testing noop
    set.resetHistory();
    await internalActions.addRemoveProject({
      id: 1,
      url: 'https://www.example.com/',
    });
    expect(set.notCalled).to.be.true;
  }).timeout(5000);

  it('internal: enableDisableProject', async () => {
    const set = sandbox.spy(chrome.storage.sync, 'set');
    // add project first
    await internalActions.addRemoveProject(mockTab('https://main--bar--foo.hlx.page/', {
      id: 1,
    }));
    // disable project
    await internalActions.enableDisableProject(mockTab('https://main--bar--foo.hlx.page/', {
      id: 1,
    }));
    expect(set.calledWith({
      'foo/bar': {
        id: 'foo/bar',
        giturl: 'https://github.com/foo/bar/tree/main',
        owner: 'foo',
        repo: 'bar',
        ref: 'main',
        disabled: true,
      },
    })).to.be.true;
    // enable project
    await internalActions.enableDisableProject(mockTab('https://main--bar--foo.hlx.page/', {
      id: 2,
    }));
    expect(set.calledWith({
      'foo/bar': {
        id: 'foo/bar',
        giturl: 'https://github.com/foo/bar/tree/main',
        owner: 'foo',
        repo: 'bar',
        ref: 'main',
      },
    })).to.be.true;
    // testing noop
    set.resetHistory();
    await internalActions.enableDisableProject(mockTab('https://www.example.com/', {
      url: 'https://www.example.com/',
    }));
    expect(set.notCalled).to.be.true;
  });

  it('internal: enableDisableProject shows correct project name in notification', async () => {
    const sendMessageStub = sandbox.spy(chrome.tabs, 'sendMessage');
    const i18nSpy = sandbox.spy(chrome.i18n, 'getMessage');

    // disable project - should show notification with project name
    await internalActions.enableDisableProject(mockTab('https://main--bar--foo.hlx.page/', {
      id: 1,
    }));

    expect(sendMessageStub.calledWithMatch(1, {
      action: 'show_notification',
      headline: 'i18n?config_project_disabled_headline',
      message: 'i18n?config_project_disabled|foo/bar',
    })).to.be.true;

    // verify the project name (foo/bar) is used in the message
    expect(i18nSpy.calledWith('config_project_disabled', 'foo/bar')).to.be.true;
  });

  describe('internal: importProjects', () => {
    let sendMessageStub;
    let i18nSpy;

    function mockLegacySidekickResponse(projects = []) {
      sandbox.stub(chrome.runtime, 'sendMessage')
        .callsFake(async (_, { action }, callback) => {
          switch (action) {
            case 'ping':
              // @ts-ignore
              callback(true);
              break;
            case 'getProjects':
              // @ts-ignore
              callback(projects);
              break;
            default:
              // @ts-ignore
              callback();
          }
        });
    }

    beforeEach(() => {
      sendMessageStub = sandbox.spy(chrome.tabs, 'sendMessage');
      i18nSpy = sandbox.spy(chrome.i18n, 'getMessage');
      sandbox.stub(chrome.runtime, 'getManifest').returns({
        ...chrome.runtime.getManifest(),
        externally_connectable: {
          ids: ['klmnopqrstuvwxyz'],
        },
      });
    });

    afterEach(() => {
      sandbox.restore();
    });

    it('single project', async () => {
      mockLegacySidekickResponse([CONFIGS[0]]);
      sandbox.stub(chrome.storage.sync, 'get').resolves({ projects: [] });

      await internalActions.importProjects(mockTab('https://main--bar--foo.hlx.page/', {
        id: 2,
      }));
      expect(i18nSpy.calledWith('config_project_imported_single', '1')).to.be.true;

      expect(sendMessageStub.calledWithMatch(2, { action: 'show_notification' })).to.be.true;
    });

    it('multiple project', async () => {
      mockLegacySidekickResponse(CONFIGS);
      sandbox.stub(chrome.storage.sync, 'get').resolves({ projects: [] });

      await internalActions.importProjects(mockTab('https://main--bar--foo.hlx.page/', {
        id: 2,
      }));

      expect(i18nSpy.calledWith('config_project_imported_multiple', '2')).to.be.true;
      expect(sendMessageStub.calledWithMatch(2, { action: 'show_notification' })).to.be.true;
    });

    it('no projects', async () => {
      mockLegacySidekickResponse([CONFIGS[1]]);
      sandbox.stub(chrome.storage.sync, 'get').resolves({ 'foo/bar2': CONFIGS[1] });

      await internalActions.importProjects(mockTab('https://main--bar--foo.hlx.page/', {
        id: 2,
      }));

      expect(i18nSpy.calledWith('config_project_imported_none', '0')).to.be.true;
      expect(sendMessageStub.calledWithMatch(2, { action: 'show_notification' })).to.be.true;
    });
  });

  it('internal: manageProjects', async () => {
    const createSpy = sandbox.spy(chrome.tabs, 'create');
    await internalActions.manageProjects(mockTab('https://main--bar--foo.hlx.page/', {
      id: 2,
    }));
    expect(createSpy.calledWithMatch({
      url: 'https://labs.aem.live/tools/project-admin/index.html',
      openerTabId: 2,
      windowId: 0,
    })).to.be.true;
  });

  it('internal: openViewDocSource', async () => {
    const { openViewDocSource } = internalActions;
    const createSpy = sandbox.spy(chrome.windows, 'create');
    await openViewDocSource({ id: 1 });
    expect(createSpy.calledWithMatch({
      url: '/test/fixtures/views/doc-source/index.html?tabId=1',
      type: 'popup',
    })).to.be.true;
  });

  it('internal: checkViewDocSource', async () => {
    const createSpy = sandbox.spy(chrome.windows, 'create');
    const logSpy = sandbox.spy(log, 'warn');
    let counter = 0;
    sandbox.stub(chrome.tabs, 'get')
      // @ts-ignore
      .callsFake(async () => {
        counter += 1;
        switch (counter) {
          case 1:
            // no tab
            return null;
          case 2:
            // tab without url
            return mockTab('');
          case 3:
            // inactive tab
            return mockTab('https://www.example.com/', {
              id: 1,
              active: false,
            });
          case 4:
            // tab with invalid url
            return mockTab('foo', {
              id: 1,
              active: true,
            });
          case 5:
            // tab without vds
            return mockTab('https://www.example.com/', {
              id: 1,
              active: true,
            });
          case 6:
            // tab with vds=false
            return mockTab('https://www.example.com/?view-doc-source=false', {
              id: 1,
              active: true,
            });
          default:
            // tab with vds=true
            return mockTab('https://www.example.com/?view-doc-source=true', {
              id: 1,
              active: true,
            });
        }
      });
    // no tab
    await checkViewDocSource(1);
    expect(createSpy.callCount).to.equal(0);
    // tab without url
    await checkViewDocSource(1);
    expect(createSpy.callCount).to.equal(0);
    // inactive tab
    await checkViewDocSource(1);
    expect(createSpy.callCount).to.equal(0);
    // tab with invalid url
    await checkViewDocSource(1);
    expect(createSpy.callCount).to.equal(0);
    expect(logSpy.calledWithMatch(/Error/)).to.be.true;
    // tab without vds
    await checkViewDocSource(1);
    expect(createSpy.callCount).to.equal(0);
    // tab with vds=false
    await checkViewDocSource(1);
    expect(createSpy.callCount).to.equal(0);
    // tab with vds=true
    await checkViewDocSource(1);
    expect(createSpy.callCount).to.equal(1);
  });

  describe('internal: getProfilePicture', () => {
    const profilePicture = 'data:image/png;base64,foo';

    it('returns existing profile picture', async () => {
      sandbox.stub(chrome.storage.session, 'get').resolves({
        projects: [{
          owner: 'foo',
          picture: profilePicture,
        }],
      });
      const { getProfilePicture } = internalActions;
      const picture = await getProfilePicture(null, { owner: 'foo' });
      expect(picture).to.equal(profilePicture);
    });

    it('returns undefined if login info not found', async () => {
      sandbox.stub(chrome.storage.session, 'get').resolves({
        projects: [{
          owner: 'bar',
          picture: profilePicture,
        }],
      });
      const { getProfilePicture } = internalActions;
      const picture = await getProfilePicture(null, { owner: 'foo' });
      expect(picture).to.be.undefined;
    });

    it('returns undefined if no owner specified', async () => {
      sandbox.stub(chrome.storage.session, 'get').resolves({
        projects: [{
          owner: 'foo',
          picture: profilePicture,
        }],
      });
      const { getProfilePicture } = internalActions;
      const picture = await getProfilePicture(null, {});
      expect(picture).to.be.undefined;
    });

    it('returns undefined if picture not found', async () => {
      sandbox.stub(chrome.storage.session, 'get').resolves({
        projects: [{
          owner: 'foo',
        }],
      });
      const { getProfilePicture } = internalActions;
      const picture = await getProfilePicture(null, { owner: 'foo' });
      expect(picture).to.be.undefined;
    });

    it('returns undefined if no projects added', async () => {
      sandbox.stub(chrome.storage.session, 'get').resolves(undefined);
      const { getProfilePicture } = internalActions;
      const picture = await getProfilePicture(null, { owner: 'foo' });
      expect(picture).to.be.undefined;
    });
  });

  describe('internal: guessAEMSite', () => {
    it('recognizes pipeline html', async () => {
      fetchMock.get('https://www.example.com/foo', {
        status: 200,
        body: PIPELINE_HTML,
        headers: {
          'content-Type': 'text/html',
        },
      });
      const isAEM = await internalActions.guessAEMSite(null, { url: 'https://www.example.com/foo' });
      expect(isAEM).to.be.true;
    });

    it('recognizes pipeline json', async () => {
      fetchMock.get('https://www.example.com/foo.json', {
        status: 200,
        body: PIPELINE_JSON,
        headers: {
          'content-Type': 'application/json',
        },
      });
      const isAEM = await internalActions.guessAEMSite(null, { url: 'https://www.example.com/foo.json' });
      expect(isAEM).to.be.true;
    });

    it('recognizes non-pipeline html', async () => {
      fetchMock.get('https://www.example.com/foo', {
        status: 200,
        body: RANDOM_HTML,
        headers: {
          'content-Type': 'text/html',
        },
      });
      const isAEM = await internalActions.guessAEMSite(null, { url: 'https://www.example.com/foo' });
      expect(isAEM).to.be.false;
    });

    it('recognizes non-pipeline json', async () => {
      fetchMock.get('https://www.example.com/foo.json', {
        status: 200,
        body: RANDOM_JSON,
        headers: {
          'content-Type': 'application/json',
        },
      });
      const isAEM = await internalActions.guessAEMSite(null, { url: 'https://www.example.com/foo.json' });
      expect(isAEM).to.be.false;
    });

    it('returns true for other mime types if ok', async () => {
      fetchMock.get('https://www.example.com/foo.png', {
        status: 200,
        body: '',
        headers: {
          'content-Type': 'image/png',
        },
      });
      const isAEM = await internalActions.guessAEMSite(null, { url: 'https://www.example.com/foo.png' });
      expect(isAEM).to.be.true;
    });

    it('returns false if invalid json', async () => {
      fetchMock.get('https://www.example.com/foo.json', {
        status: 200,
        body: "{ 'foo': 'bar' }",
        headers: {
          'content-Type': 'application/json',
        },
      });
      const isAEM = await internalActions.guessAEMSite(null, { url: 'https://www.example.com/foo.json' });
      expect(isAEM).to.be.false;
    });

    it('returns false if redirected', async () => {
      fetchMock.get('https://www.example.com/foo', {
        status: 0,
      });
      const isAEM = await internalActions.guessAEMSite(null, { url: 'https://www.example.com/foo' });
      expect(isAEM).to.be.false;
    });

    it('returns false if 404', async () => {
      fetchMock.get('https://www.example.com/foo', {
        status: 404,
      });
      const isAEM = await internalActions.guessAEMSite(null, { url: 'https://www.example.com/foo' });
      expect(isAEM).to.be.false;
    });

    it('returns false if 5xx', async () => {
      fetchMock.get('https://www.example.com/foo', {
        status: 500,
      });
      const isAEM = await internalActions.guessAEMSite(null, { url: 'https://www.example.com/foo' });
      expect(isAEM).to.be.false;
    });

    it('returns true if 401', async () => {
      fetchMock.get('https://www.example.com/foo', {
        status: 401,
      });
      const isAEM = await internalActions.guessAEMSite(null, { url: 'https://www.example.com/foo' });
      expect(isAEM).to.be.true;
    });

    it('returns true if network error', async () => {
      fetchMock.get('https://www.example.com/foo', {
        throws: new Error('Network error'),
      });
      const isAEM = await internalActions.guessAEMSite(null, { url: 'https://www.example.com/foo' });
      expect(isAEM).to.be.true;
    });
  });

  it('notificationConfirmCallback', async () => {
    const reloadStub = sandbox.stub(chrome.tabs, 'reload');
    const callback = notificationConfirmCallback(1);
    await callback();
    expect(reloadStub.calledOnce).to.be.true;
  });

  describe('internal: updateProject', () => {
    it('updates existing project config when properties have changed', async () => {
      const project = {
        owner: 'adobe',
        repo: 'business-website',
        ref: 'main',
        previewHost: 'old-preview.example.com',
        liveHost: 'old-live.example.com',
        reviewHost: 'old-review.example.com',
        project: 'business-website',
        mountpoints: ['/content/business-website'],
        host: 'business-website.example.com',
      };

      const existingProject = {
        ...project,
        previewHost: 'different-preview.example.com', // trigger an update
      };

      // mock getProject to return existing project
      const getStub = sandbox.stub(chrome.storage.sync, 'get');
      getStub.withArgs('projects').resolves({ projects: ['adobe/business-website'] });
      getStub.withArgs('adobe/business-website').resolves({ 'adobe/business-website': existingProject });

      // mock updateProject to verify it's called
      const updateProjectStub = sandbox.stub(chrome.storage.sync, 'set')
        .resolves();

      await internalActions.updateProject({}, { config: project });

      expect(updateProjectStub.calledOnce).to.be.true;
      expect(updateProjectStub.firstCall.args[0]).to.deep.equal({
        'adobe/business-website': project,
      });
    });

    it('does not update project when no properties have changed', async () => {
      const project = {
        owner: 'adobe',
        repo: 'business-website',
        ref: 'main',
        previewHost: 'old-preview.example.com',
        liveHost: 'old-live.example.com',
        reviewHost: 'old-review.example.com',
        project: 'business-website',
        mountpoints: ['/content/business-website'],
        host: 'business-website.example.com',
      };

      // mock getProject to return existing project with same values
      const getStub = sandbox.stub(chrome.storage.sync, 'get');
      getStub.withArgs('projects').resolves({ projects: ['adobe/business-website'] });
      getStub.withArgs('adobe/business-website').resolves({ 'adobe/business-website': project });

      // mock updateProject to verify it's not called
      const updateProjectStub = sandbox.stub(chrome.storage.sync, 'set');

      await internalActions.updateProject({}, { config: project });

      expect(updateProjectStub.called).to.be.false;
    });

    it('does not overwrite existing project name', async () => {
      const project = {
        owner: 'adobe',
        repo: 'business-website',
        ref: 'main',
        project: 'Business Website',
      };

      const existingProject = {
        ...project,
        project: 'existing project name',
      };

      // mock getProject to return existing project
      const getStub = sandbox.stub(chrome.storage.sync, 'get');
      getStub.withArgs('projects').resolves({ projects: ['adobe/business-website'] });
      getStub.withArgs('adobe/business-website').resolves({ 'adobe/business-website': existingProject });

      // mock updateProject to verify it's not called
      const updateProjectStub = sandbox.stub(chrome.storage.sync, 'set');

      await internalActions.updateProject({}, { config: project });

      expect(updateProjectStub.called).to.be.false;
    });

    it('does not update non-existent project', async () => {
      const project = {
        owner: 'adobe',
        repo: 'business-website',
        ref: 'main',
        previewHost: 'old-preview.example.com',
        liveHost: 'old-live.example.com',
        reviewHost: 'old-review.example.com',
        project: 'business-website',
        mountpoints: ['/content/business-website'],
        host: 'business-website.example.com',
      };

      // mock getProject to return null (project doesn't exist)
      const getStub = sandbox.stub(chrome.storage.sync, 'get');
      getStub.withArgs('projects').resolves({ projects: [] });
      getStub.withArgs('adobe/business-website').resolves({});

      // mock updateProject to verify it's not called
      const updateProjectStub = sandbox.stub(chrome.storage.sync, 'set');

      await internalActions.updateProject({}, { config: project });

      expect(updateProjectStub.called).to.be.false;
    });

    it('does not update project with missing required fields', async () => {
      const project = {
        owner: 'adobe',
        // missing repo
        ref: 'main',
        previewHost: 'old-preview.example.com',
      };

      // mock updateProject to verify it's not called
      const updateProjectStub = sandbox.stub(chrome.storage.sync, 'set');

      await internalActions.updateProject({}, { config: project });

      expect(updateProjectStub.called).to.be.false;
    });

    it('preserves existing project properties when updating', async () => {
      const existingProject = {
        id: 'adobe/business-website',
        owner: 'adobe',
        repo: 'business-website',
        ref: 'main',
        project: 'Business Website',
        giturl: 'https://github.com/adobe/business-website/tree/main',
        host: 'business-website.example.com',
        previewHost: 'preview.business-website.example.com',
        liveHost: 'live.business-website.example.com',
        mountpoints: ['/content/business-website'],
        disabled: false,
      };

      const updateConfig = {
        owner: 'adobe',
        repo: 'business-website',
        ref: 'main',
        previewHost: 'new-preview.business-website.example.com', // only this property changes
      };

      // mock getProject to return existing project
      const getStub = sandbox.stub(chrome.storage.sync, 'get');
      getStub.withArgs('projects').resolves({ projects: ['adobe/business-website'] });
      getStub.withArgs('adobe/business-website').resolves({ 'adobe/business-website': existingProject });

      // mock updateProject to verify it's called with preserved properties
      const updateProjectStub = sandbox.stub(chrome.storage.sync, 'set')
        .resolves();

      await internalActions.updateProject({}, { config: updateConfig });

      expect(updateProjectStub.calledOnce).to.be.true;

      // Verify that the updated project preserves all existing properties
      const updatedProject = updateProjectStub.firstCall.args[0]['adobe/business-website'];

      // Essential properties should be preserved
      expect(updatedProject.id).to.equal('adobe/business-website');
      expect(updatedProject.owner).to.equal('adobe');
      expect(updatedProject.repo).to.equal('business-website');
      expect(updatedProject.ref).to.equal('main');
      expect(updatedProject.project).to.equal('Business Website');
      expect(updatedProject.giturl).to.equal('https://github.com/adobe/business-website/tree/main');
      expect(updatedProject.host).to.equal('business-website.example.com');
      expect(updatedProject.liveHost).to.equal('live.business-website.example.com');
      expect(updatedProject.mountpoints).to.deep.equal(['/content/business-website']);
      expect(updatedProject.disabled).to.equal(false);

      // The updated property should be changed
      expect(updatedProject.previewHost).to.equal('new-preview.business-website.example.com');
    });

    it('saves document in sharepoint', async () => {
      const saveDocumentStub = sandbox.stub(chrome.tabs, 'sendMessage');
      await internalActions.saveDocument({ id: 1, url: 'https://foo.sharepoint.com/:w:/r/sites/foo/_layouts/15/Doc.aspx?sourcedoc=%7BBFD9A19C-4A68-4DBF-8641-DA2F1283C895%7D&file=bla.docx&action=default&mobileredirect=true' });
      expect(saveDocumentStub.calledWithMatch(1, { action: 'saveDocument' })).to.be.true;
    });
  });
});
