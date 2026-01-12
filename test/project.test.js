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
import {
  getProject,
  getProjects,
  getProjectEnv,
  assembleProject,
  addProject,
  updateProject,
  deleteProject,
  isValidHost,
  isValidProject,
  getProjectMatches,
  getGitHubSettings,
  getProjectFromUrl,
  resolveProxyUrl,
  detectLegacySidekick,
  importLegacyProjects,
} from '../src/extension/project.js';
import { urlCache } from '../src/extension/url-cache.js';
import { error, mockTab } from './test-utils.js';
import { mockDiscoveryCall } from './mocks/discover.js';

// @ts-ignore
window.chrome = chromeMock;

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

const CONFIG_JSON = {
  host: 'business.adobe.com',
  previewHost: 'preview.example.com',
  liveHost: 'live.example.com',
  project: 'Adobe Business Website',
  mountpoints: ['https://adobe.sharepoint.com/:f:/s/Dummy/Alk9MSH25LpBuUWA_N6DOL8BuI6Vrdyrr87gne56dz3QeQ'],
  contentSourceUrl: 'https://adobe.sharepoint.com/:f:/s/Dummy/Alk9MSH25LpBuUWA_N6DOL8BuI6Vrdyrr87gne56dz3QeQ',
  contentSourceType: 'onedrive',
};

describe('Test project', () => {
  let sandbox;

  before(async () => {
    await setUserAgent('HeadlessChrome');
  });

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('getProject', async () => {
    // get project without handle
    const none = await getProject();
    expect(none).to.be.undefined;
    // get project with handle
    const stub = sandbox.stub(window.chrome.storage.sync, 'get');
    await getProject('foo/bar1');
    expect(stub.withArgs('foo/bar1').callCount).to.equal(1);
    // get project with config object
    await getProject({ owner: 'foo', repo: 'bar1' });
    expect(stub.withArgs('foo/bar1').callCount).to.equal(2);
  }).timeout(5000);

  it('getProjects', async () => {
    const fake = sandbox.fake(async (prop) => {
      let value;
      switch (prop) {
        case 'projects':
          value = ['foo/bar1'];
          break;
        case 'foo/bar1':
          [value] = CONFIGS;
          break;
        default:
          value = null;
      }
      return new Promise((resolve) => {
        resolve({
          [prop]: value,
        });
      });
    });
    sandbox.replace(chrome.storage.sync, 'get', fake);
    let projects = await getProjects();
    expect(fake.callCount).to.equal(2);
    expect(projects.length).to.equal(1);
    // no projects yet
    sandbox.restore();
    sandbox.stub(chrome.storage.sync, 'get')
      .withArgs('projects')
      .resolves({});
    projects = await getProjects();
    expect(projects.length).to.equal(0);
  });

  it('getProjectEnv', async () => {
    sandbox.stub(window, 'fetch')
      .onFirstCall()
      .resolves(new Response(JSON.stringify(CONFIG_JSON)))
      .onSecondCall()
      .resolves(new Response(JSON.stringify({
        ...CONFIG_JSON,
        reviewHost: 'review.example.com',
      })))
      .onThirdCall()
      .resolves(new Response(JSON.stringify({})))
      .onCall(4)
      .throws(error);
    const {
      host, project, mountpoints = [],
    } = await getProjectEnv({
      owner: 'adobe',
      repo: 'business-website',
    });
    expect(host).to.equal('business.adobe.com');
    expect(project).to.equal('Adobe Business Website');
    expect(mountpoints[0]).to.equal('https://adobe.sharepoint.com/:f:/s/Dummy/Alk9MSH25LpBuUWA_N6DOL8BuI6Vrdyrr87gne56dz3QeQ');

    // Check that mountpoints is an array
    expect(Array.isArray(mountpoints)).to.be.true;

    // env with custom reviewHost
    const customReviewHost = await getProjectEnv({
      owner: 'adobe',
      repo: 'blog',
    });
    expect(customReviewHost.reviewHost).to.equal('review.example.com');

    // testing else paths
    const empty = await getProjectEnv({
      owner: 'adobe',
      repo: 'blog',
    });
    expect(empty).to.eql({});
    // error handling
    // @ts-ignore
    const failure = await getProjectEnv({});
    expect(failure).to.eql({});
  });

  it('assembleProject with giturl', async () => {
    const {
      owner, repo, ref,
    } = assembleProject({
      giturl: 'https://github.com/adobe/business-website/tree/main',
    });
    expect(owner).to.equal('adobe');
    expect(repo).to.equal('business-website');
    expect(ref).to.equal('main');
  });

  it('assembleProject with owner and repo', async () => {
    const {
      giturl,
    } = assembleProject({
      owner: 'adobe',
      repo: 'business-website',
      ref: 'test',
    });
    expect(giturl).to.equal('https://github.com/adobe/business-website/tree/test');
  });

  it('addProject', async () => {
    const spy = sandbox.spy(chrome.storage.sync, 'set');
    sandbox.stub(window, 'fetch')
      .onCall(1)
      .resolves(new Response(JSON.stringify(CONFIG_JSON)))
      .onCall(2)
      .resolves(new Response('', { status: 401 }))
      .onCall(3)
      .resolves(new Response(JSON.stringify(CONFIG_JSON)))
      .onCall(4)
      .resolves(new Response('', { status: 401 }))
      .resolves(new Response(JSON.stringify(CONFIG_JSON)));

    // add project
    const added = await addProject({
      giturl: 'https://github.com/test/project',
    });
    expect(added).to.be.true;
    expect(spy.calledWith({
      projects: ['test/project'],
    })).to.be.true;

    // add project with auth enabled
    const callback = sandbox.stub(chrome.runtime.onMessageExternal, 'addListener');
    callback
      .onFirstCall()
      .callsFake(async (func, _) => {
        func({ owner: 'test', repo: 'auth-project', authToken: 'foo' });
      })
      .onSecondCall()
      .callsFake((async (func, _) => func()));
    const addedWithAuth = await addProject({
      giturl: 'https://github.com/test/auth-project',
    });
    expect(addedWithAuth).to.be.true;
    expect(spy.calledWith({
      projects: ['test/project', 'test/auth-project'],
    })).to.be.true;
    // try again with emtpy callback message
    const addedWithoutAuth = await addProject({
      giturl: 'https://github.com/test/auth-project',
    });
    expect(addedWithoutAuth).to.be.false;

    // add existing
    const addedExisting = await addProject({
      giturl: 'https://github.com/test/auth-project',
    });
    expect(addedExisting).to.be.false;
  });

  it('addProject loginHint parameter handling', async () => {
    const spy = sandbox.spy(chrome.storage.sync, 'set');

    sandbox.stub(chrome.tabs, 'query').resolves([{ id: 1 }]);
    sandbox.stub(chrome.tabs, 'create').resolves({ id: 2 });
    sandbox.stub(chrome.tabs, 'remove').resolves();
    sandbox.stub(chrome.tabs, 'update').resolves();
    sandbox.stub(chrome.runtime.onMessageExternal, 'removeListener');
    sandbox.stub(chrome.storage.sync, 'get')
      .withArgs('projects')
      .resolves({ projects: [] })
      .withArgs('test/login-project')
      .resolves({ 'test/login-project': undefined });

    const addListenerStub = sandbox.stub(chrome.runtime.onMessageExternal, 'addListener');
    addListenerStub.callsFake(async (func, _) => {
      // simulate successful login response from admin
      await func({ owner: 'test', repo: 'login-project', authToken: 'token123' });
    });

    sandbox.stub(window, 'fetch')
      .onCall(0)
      // return 401 from admin to trigger login flow
      .resolves(new Response('', { status: 401 }))
      .onCall(1)
      // return 200 from admin to add project after login
      .resolves(new Response(JSON.stringify({
        host: 'test.com',
        previewHost: 'preview.test.com',
        liveHost: 'live.test.com',
        project: 'Test Project',
      }), { status: 200 }));

    const result = await addProject({
      giturl: 'https://github.com/test/login-project',
    }, false, { idp: 'microsoft', tenant: 'common' });

    expect(addListenerStub.called).to.be.true;
    expect(result).to.be.true;
    expect(spy.calledWith({
      projects: ['test/login-project'],
    })).to.be.true;
  });

  it('updateProject', async () => {
    const set = sandbox.spy(chrome.storage.sync, 'set');
    const project = {
      owner: 'test',
      repo: 'project',
      ref: 'main',
      project: 'Test',
      dummy: undefined, // ignore this
    };
    const updated = await updateProject({ ...project });
    delete project.dummy;
    expect(updated).to.eql(project);
    expect(set.calledWith({
      'test/project': project,
    })).to.be.true;
    const invalid = await updateProject({ foo: 'bar' });
    expect(invalid).to.equal(null);
    // no projects yet
    set.resetHistory();
    sandbox.stub(chrome.storage.sync, 'get')
      .withArgs('projects')
      .resolves({});
    await updateProject({ ...project });
    expect(set.calledWith({
      'test/project': project,
    })).to.be.true;
  });

  it('deleteProject', async () => {
    const spy = sandbox.spy(chrome.storage.sync, 'set');
    let projectsStub = sandbox.stub(chrome.storage.sync, 'get');
    projectsStub
      .withArgs('projects')
      .resolves({
        projects: ['foo/bar1', 'foo/bar2'],
      });

    // delete project with config object
    let deleted = await deleteProject({ owner: 'foo', repo: 'bar1' });
    expect(deleted).to.be.true;
    expect(spy.calledWith({
      projects: ['foo/bar2'],
    })).to.be.true;
    // delete project with handle
    deleted = await deleteProject('foo/bar2');
    expect(deleted).to.be.true;
    expect(spy.calledWith({
      projects: [],
    })).to.be.true;
    // delete inexistent project
    projectsStub.restore();
    projectsStub = sandbox.stub(chrome.storage.sync, 'get')
      .withArgs('projects')
      .resolves([]);
    deleted = await deleteProject('test/project');
    expect(deleted).to.be.false;
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

  it('isValidProject', () => {
    expect(isValidProject({ owner: 'foo', repo: 'bar', ref: 'main' })).to.be.true;
    expect(isValidProject({ owner: 'foo', repo: 'bar' })).to.be.false;
    expect(isValidProject({ owner: 'foo' })).to.be.false;
    expect(isValidProject()).to.be.false;
  });

  it('getProjectMatches', async () => {
    // match preview URL
    expect((await getProjectMatches(CONFIGS, mockTab('https://main--bar1--foo.hlx.page/'))).length).to.equal(1);
    // match preview URL with any ref
    expect((await getProjectMatches(CONFIGS, mockTab('https://baz--bar1--foo.hlx.page/'))).length).to.equal(1);
    // match custom preview URL
    expect((await getProjectMatches(CONFIGS, mockTab('https://6-preview.foo.bar/'))).length).to.equal(1);
    // match live URL
    expect((await getProjectMatches(CONFIGS, mockTab('https://main--bar1--foo.hlx.live/'))).length).to.equal(1);
    // match custom live URL
    expect((await getProjectMatches(CONFIGS, mockTab('https://6-live.foo.bar/'))).length).to.equal(1);
    // match production host
    expect((await getProjectMatches(CONFIGS, mockTab('https://1.foo.bar/'))).length).to.equal(1);
    // ignore disabled config
    expect((await getProjectMatches(CONFIGS, mockTab('https://main--bar2--foo.hlx.live/'))).length).to.equal(0);
    // match transient URL
    expect((await getProjectMatches(CONFIGS, mockTab('https://main--bar0--foo.hlx.live/'))).length).to.equal(1);
    // testing else paths
    expect((await getProjectMatches(CONFIGS, mockTab('https://bar--foo.hlx.live/'))).length).to.equal(0);
    await urlCache.set(mockTab('https://7.foo.bar/'), { owner: 'foo', repo: 'bar6' });
    expect((await getProjectMatches(CONFIGS, mockTab('https://7.foo.bar/'))).length).to.equal(1);
    // match sharepoint URL (docx)
    mockDiscoveryCall();
    await urlCache.set(mockTab('https://foo.sharepoint.com/:w:/r/sites/foo/_layouts/15/Doc.aspx?sourcedoc=%7BBFD9A19C-4A68-4DBF-8641-DA2F1283C895%7D&file=index.docx&action=default&mobileredirect=true'));
    expect((await getProjectMatches(CONFIGS, mockTab('https://foo.sharepoint.com/:w:/r/sites/foo/_layouts/15/Doc.aspx?sourcedoc=%7BBFD9A19C-4A68-4DBF-8641-DA2F1283C895%7D&file=index.docx&action=default&mobileredirect=true'))).length).to.equal(1);
    // match transient sharepoint URL
    await urlCache.set(mockTab('https://foo.sharepoint.com/:w:/r/sites/foo/_layouts/15/Doc.aspx?sourcedoc=%7BBFD9A19C-4A68-4DBF-8641-DA2F1283C895%7D&file=test.docx&action=default&mobileredirect=true'));
    expect((await getProjectMatches([], mockTab('https://foo.sharepoint.com/:w:/r/sites/foo/_layouts/15/Doc.aspx?sourcedoc=%7BBFD9A19C-4A68-4DBF-8641-DA2F1283C895%7D&file=test.docx&action=default&mobileredirect=true'))).length).to.equal(1);
    // match transient gdrive URL
    await urlCache.set(mockTab('https://docs.google.com/document/d/1234567890/edit'), { owner: 'foo', repo: 'bar0' });
    expect((await getProjectMatches(CONFIGS, mockTab('https://docs.google.com/document/d/1234567890/edit'))).length).to.equal(1);
    // match multiple original sites from cache
    mockDiscoveryCall({ multipleOriginalSites: true });
    const tab = mockTab('https://foo.sharepoint.com/something/boo/Shared%20Documents/root1');
    await urlCache.set(tab);
    const matches = await getProjectMatches([], tab);
    expect(matches.length).to.equal(2);
    expect(matches[0].id).to.equal('foo/bar1');
  }).timeout(5000);

  it('getGitHubSettings', async () => {
    const github = getGitHubSettings('https://github.com/adobe/blog/tree/stage');
    expect(github).to.eql({
      owner: 'adobe',
      repo: 'blog',
      ref: 'stage',
    });
    const dotgit = getGitHubSettings('https://github.com/adobe/blog.git');
    expect(dotgit).to.eql({
      owner: 'adobe',
      repo: 'blog',
      ref: 'main',
    });
    const nogithub = getGitHubSettings('https://www.example.com');
    expect(nogithub).to.eql({});
    const norepo = getGitHubSettings('https://github.com/adobe');
    expect(norepo).to.eql({});
  });

  it('getProjectFromUrl', async () => {
    const settings = {
      owner: 'adobe',
      repo: 'blog',
      ref: 'stage',
    };

    // test github url
    const github = await getProjectFromUrl(mockTab('https://github.com/adobe/blog/tree/stage'));
    expect(github).to.eql(settings);
    const share = await getProjectFromUrl(mockTab('https://www.aem.live/tools/sidekick/?giturl=https://github.com/adobe/blog/tree/stage&project=Blog'));
    expect(share).to.eql({
      project: 'Blog',
      ...settings,
    });

    // test no match
    const nomatch = await getProjectFromUrl(mockTab('https://blog.adobe.com'));
    expect(nomatch).to.eql({});

    // test cached result
    urlCache.set(mockTab('https://blog.adobe.com'), settings);
    const cached = await getProjectFromUrl(mockTab('https://blog.adobe.com'));
    expect(cached).to.eql({ ...settings, ref: 'main' });

    // test multiple cached results, but one is originalSite
    const urlCacheGetStub = sandbox.stub(urlCache, 'get');
    urlCacheGetStub.resolves([
      settings,
      {
        org: 'foo',
        site: 'bar',
        // @ts-ignore
        originalSite: true,
      },
    ]);
    const cachedOriginalSite = await getProjectFromUrl(mockTab('https://foo.bar'));
    expect(cachedOriginalSite).to.eql({
      owner: 'foo',
      repo: 'bar',
      ref: 'main',
    });
    urlCacheGetStub.restore();

    // test incomplete sharing url
    const sharenogiturl = await getProjectFromUrl(mockTab('https://www.aem.live/tools/sidekick/'));
    expect(sharenogiturl).to.eql({});

    // test invalid shaaring url
    const shareinvalidgiturl = await getProjectFromUrl(mockTab('https://www.aem.live/tools/sidekick/?giturl=https://www.example.com'));
    expect(shareinvalidgiturl).to.eql({});

    // @ts-ignore
    const none = await getProjectFromUrl();
    expect(none).to.eql({});
  });

  describe('resolveProxyUrl', () => {
    let tab;
    let messageFromTab;

    beforeEach(() => {
      // stub message sender and intercept message
      sandbox.stub(chrome.runtime, 'sendMessage')
        .callsFake(async (msg) => {
          messageFromTab = msg;
        });

      afterEach(() => {
        messageFromTab = null;
      });

      // stub message receiver and invoke callback
      sandbox.stub(chrome.runtime.onMessage, 'addListener')
        .callsFake((func) => func(
          messageFromTab,
          {
            tab,
          },
          null,
        ));
    });

    it('resolveProxyUrl: dev url', async () => {
      const proxyUrl = 'https://main--bar--foo.hlx.page/';
      const tabUrl = 'http://localhost:3000/foo';

      // add proxyUrl meta tag
      const meta = document.createElement('meta');
      meta.setAttribute('property', 'hlx:proxyUrl');
      meta.setAttribute('content', proxyUrl);
      document.head.append(meta);

      tab = mockTab(tabUrl);

      const res = await resolveProxyUrl(tab, []);
      expect(res.url).to.equal(proxyUrl);
      document.head.removeChild(meta);
    });

    it('resolveProxyUrl: non-dev url', async () => {
      const tabUrl = 'https://main--bar--foo.hlx.page/';

      tab = mockTab(tabUrl);

      const res = await resolveProxyUrl(tab, []);
      expect(res.url).to.equal(tabUrl);
    });

    it('resolveProxyUrl: dev url without meta tag', async () => {
      const tabUrl = 'http://localhost:3000/foo';

      tab = mockTab(tabUrl);

      const res = await resolveProxyUrl(tab, []);
      expect(res.url).to.equal(tabUrl);
    });

    it('resolveProxyUrl: dev url with meta tag but no proxyUrl', async () => {
      const tabUrl = 'http://localhost:3000/foo';
      // @ts-ignore
      chrome.runtime.sendMessage.restore();
      sandbox.stub(chrome.runtime, 'sendMessage')
        .callsFake(async () => {
          messageFromTab = {};
        });

      tab = mockTab(tabUrl);

      const res = await resolveProxyUrl(tab, []);
      expect(res.url).to.equal(tabUrl);
    });
  });

  describe('legacy project migration', () => {
    const legacySidekickId = 'klmnopqrstuvwxyz';

    function mockLegacySidekickResponse(extensionId, lastError, projects) {
      const stub = sandbox.stub(chrome.runtime, 'sendMessage');
      stub.callsFake(async (msgId, { action }, callback) => {
        if (lastError) {
          // @ts-ignore
          chrome.runtime.lastError = lastError;
        }
        switch (action) {
          case 'ping':
            callback(msgId === extensionId);
            break;
          case 'getProjects':
            callback(msgId === extensionId ? projects : null);
            break;
          default:
            callback();
        }
      });
      return stub;
    }

    beforeEach(() => {
      sandbox.stub(chrome.runtime, 'getManifest').returns({
        ...chrome.runtime.getManifest(),
        externally_connectable: {
          ids: [
            'some_extension_id',
            legacySidekickId,
            'other_extension_id',
          ],
        },
      });
    });

    describe('detectLegacySidekick', () => {
      it('detects legacy sidekick and returns id', async () => {
        mockLegacySidekickResponse(legacySidekickId);
        const id = await detectLegacySidekick();
        expect(id).to.equal(legacySidekickId);
      });

      it('no legacy sidekick present', async () => {
        mockLegacySidekickResponse(); // no id matches
        const id = await detectLegacySidekick();
        expect(id).to.be.undefined;
      });

      it('chrome.runtime.lastError exists', async () => {
        mockLegacySidekickResponse(legacySidekickId, error);
        const id = await detectLegacySidekick();
        expect(id).to.be.undefined;
      });

      it('chrome.runtime.sendMessage throws', async () => {
        sandbox.stub(chrome.runtime, 'sendMessage').throws(error);
        const id = await detectLegacySidekick();
        expect(id).to.be.undefined;
      });
    });

    describe('importLegacyProjects', () => {
      it('no legacy sidekick present', async () => {
        mockLegacySidekickResponse(); // no id matches
        const imported = await importLegacyProjects();
        expect(imported).to.equal(0);
      });

      it('legacy sidekick responds with null', async () => {
        mockLegacySidekickResponse(legacySidekickId, null, null);
        const imported = await importLegacyProjects(legacySidekickId);
        expect(imported).to.equal(0);
      });

      it('legacy sidekick responds with empty array', async () => {
        mockLegacySidekickResponse(legacySidekickId, null, []);
        const imported = await importLegacyProjects(legacySidekickId);
        expect(imported).to.equal(0);
      });

      it('legacy sidekick responds with new projects', async () => {
        mockLegacySidekickResponse(legacySidekickId, null, CONFIGS);
        const imported = await importLegacyProjects(legacySidekickId);
        expect(imported).to.equal(6);
      });

      it('legacy sidekick responds with existing project', async () => {
        mockLegacySidekickResponse(legacySidekickId, null, [CONFIGS[0]]);
        sandbox.stub(chrome.storage.sync, 'get')
          .callsFake(async (prop) => {
            const value = prop.includes('/')
              ? CONFIGS.find(({ owner, repo }) => prop === `${owner}/${repo}`) // project
              : CONFIGS.slice(0, 1).map(({ owner, repo }) => `${owner}/${repo}`); // projects
            return { [prop]: value };
          });
        const imported = await importLegacyProjects(legacySidekickId);
        expect(imported).to.equal(0);
      });

      it('chrome.runtime.sendMessage throws', async () => {
        mockLegacySidekickResponse(legacySidekickId, null, CONFIGS)
          .withArgs(legacySidekickId)
          .onFirstCall()
          .throws(error);
        const imported = await importLegacyProjects(legacySidekickId);
        expect(imported).to.equal(0);
      });
    });
  });
});
