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

import {
  checkViewDocSource,
  externalActions,
  internalActions,
  notificationConfirmCallback,
} from '../src/extension/actions.js';
import chromeMock from './mocks/chrome.js';
import { error, mockTab } from './test-utils.js';
import { log } from '../src/extension/log.js';

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
      mockTab('https://admin.hlx.page/auth/test/project/main'),
    );
    expect(set.called).to.be.true;
    expect(resp).to.equal('close');
    // from unauthorized url
    resp = await externalActions.updateAuthToken(
      {
        owner, repo, authToken, exp,
      },
      mockTab('https://admin.hlx.fake/'),
    );
    expect(resp).to.equal('invalid message');
    // error handling
    sandbox.stub(window, 'URL').throws(error);
    resp = await externalActions.updateAuthToken(
      {
        owner, repo, authToken, exp,
      },
      mockTab('https://admin.hlx.page/auth/test/project/main'),
    );
    expect(resp).to.equal('invalid message');
    // testing noops
    set.resetHistory();
    await externalActions.updateAuthToken(
      { owner, repo },
      mockTab('https://admin.hlx.page/auth/test/project/main'),
    );
    await externalActions.updateAuthToken(
      {
        owner, repo, authToken, exp,
      },
      mockTab('https://some.malicious.actor/'),
    );
    await externalActions.updateAuthToken({}, {});
    expect(set.notCalled).to.be.true;
  });

  it('external: getAuthInfo', async () => {
    const getStub = sandbox.stub(chrome.storage.session, 'get');
    let resp;

    // without auth info
    getStub.resolves({});
    resp = await externalActions.getAuthInfo({}, mockTab('https://tools.aem.live'));
    expect(resp).to.deep.equal([]);

    // with auth info
    getStub.resolves({
      projects: [{
        // valid auth token, include
        owner: 'foo',
        repo: 'bar',
        authToken: '1234567890',
        authTokenExpiry: Date.now() / 1000 + 60,
      }, {
        // expired auth token, exclude
        owner: 'foo2',
        repo: 'baz',
        authToken: '1234567890',
        authTokenExpiry: Date.now() / 1000 - 60,
      }, {
        // no auth token, exclude
        owner: 'foo1',
        repo: 'baz',
      }],
    });

    // trusted actors
    resp = await externalActions.getAuthInfo({}, mockTab('https://tools.aem.live/'));
    expect(resp).to.deep.equal(['foo']);

    resp = await externalActions.getAuthInfo({}, mockTab('https://tools.aem.live/test'));
    expect(resp).to.deep.equal(['foo']);

    resp = await externalActions.getAuthInfo({}, mockTab('https://feature--helix-labs-website--adobe.aem.page/feature'));
    expect(resp).to.deep.equal(['foo']);

    // untrusted actors
    resp = await externalActions.getAuthInfo({}, mockTab('https://evil.live'));
    expect(resp).to.deep.equal([]);

    resp = await externalActions.getAuthInfo({}, mockTab('https://main--site--owner.aem.live'));
    expect(resp).to.deep.equal([]);

    resp = await externalActions.getAuthInfo({}, mockTab('https://tools.aem.live.evil.com'));
    expect(resp).to.deep.equal([]);

    resp = await externalActions.getAuthInfo({}, mockTab('https://main--helix-tools-website--adobe.aem.live.evil.com'));
    expect(resp).to.deep.equal([]);
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
  });

  it('notificationConfirmCallback', async () => {
    const reloadStub = sandbox.stub(chrome.tabs, 'reload');
    const callback = notificationConfirmCallback(1);
    await callback();
    expect(reloadStub.calledOnce).to.be.true;
  });
});
