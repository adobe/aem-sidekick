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
} from '../../src/extension/project.js';
import { urlCache } from '../../src/extension/url-cache.js';
import { error } from './test-utils.js';
import { mockDiscoveryCalls } from './mocks/discover.js';

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

const ENV_JSON = {
  version: 1,
  prod: {
    host: 'business.adobe.com',
    routes: [],
  },
  preview: {
    host: 'preview.example.com',
  },
  live: {
    host: 'live.example.com',
  },
  project: 'Adobe Business Website',
  contentSourceUrl: 'https://adobe.sharepoint.com/:f:/s/Dummy/Alk9MSH25LpBuUWA_N6DOL8BuI6Vrdyrr87gne56dz3QeQ',
  contentSourceType: 'onedrive',
};

describe('Test project', () => {
  before(async () => {
    await setUserAgent('HeadlessChrome');
  });

  afterEach(() => {
    sinon.restore();
  });

  it('getProject', async () => {
    // get project without handle
    const none = await getProject();
    expect(none).to.be.undefined;
    // get project with handle
    const stub = sinon.stub(window.chrome.storage.sync, 'get');
    await getProject('foo/bar1');
    expect(stub.withArgs('foo/bar1').callCount).to.equal(1);
    // get project with config object
    await getProject({ owner: 'foo', repo: 'bar1' });
    expect(stub.withArgs('foo/bar1').callCount).to.equal(2);
  }).timeout(5000);

  it('getProjects', async () => {
    const fake = sinon.fake(async (prop) => {
      let value;
      switch (prop) {
        case 'projects':
        case 'hlxSidekickProjects': // legacy
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
    sinon.replace(chrome.storage.sync, 'get', fake);
    let projects = await getProjects();
    expect(fake.callCount).to.equal(2);
    expect(projects.length).to.equal(1);
    // no projects yet
    sinon.restore();
    sinon.stub(chrome.storage.sync, 'get')
      .withArgs('projects')
      .resolves({})
      .withArgs('hlxSidekickProjects')
      .resolves({});
    projects = await getProjects();
    expect(projects.length).to.equal(0);
    // legacy projects
    sinon.restore();
    sinon.stub(chrome.storage.sync, 'get')
      .withArgs('projects')
      .resolves({})
      .withArgs('hlxSidekickProjects')
      .resolves({
        hlxSidekickProjects: ['foo/bar1'],
      });
    projects = await getProjects();
    expect(projects.length).to.equal(1);
  });

  it('getProjectEnv', async () => {
    sinon.stub(window, 'fetch')
      .onFirstCall()
      .resolves(new Response(JSON.stringify(ENV_JSON)))
      .onSecondCall()
      .resolves(new Response(JSON.stringify({})))
      .onThirdCall()
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
    const spy = sinon.spy(chrome.storage.sync, 'set');
    sinon.stub(window, 'fetch')
      .onCall(1)
      .resolves(new Response(JSON.stringify(ENV_JSON)))
      .onCall(2)
      .resolves(new Response('', { status: 401 }))
      .onCall(3)
      .resolves(new Response(JSON.stringify(ENV_JSON)))
      .onCall(4)
      .resolves(new Response('', { status: 401 }))
      .resolves(new Response(JSON.stringify(ENV_JSON)));

    // add project
    const added = await addProject({
      giturl: 'https://github.com/test/project',
    });
    expect(added).to.be.true;
    expect(spy.calledWith({
      projects: ['test/project'],
    })).to.be.true;

    // add project with auth enabled
    const callback = sinon.stub(chrome.runtime.onMessageExternal, 'addListener');
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

  it('updateProject', async () => {
    const set = sinon.spy(chrome.storage.sync, 'set');
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
    sinon.stub(chrome.storage.sync, 'get')
      .withArgs('projects')
      .resolves({});
    await updateProject({ ...project });
    expect(set.calledWith({
      'test/project': project,
    })).to.be.true;
  });

  it('deleteProject', async () => {
    const spy = sinon.spy(chrome.storage.sync, 'set');
    let projectsStub = sinon.stub(chrome.storage.sync, 'get');
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
    projectsStub = sinon.stub(chrome.storage.sync, 'get')
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
    expect((await getProjectMatches(CONFIGS, 'https://main--bar1--foo.hlx.page/')).length).to.equal(1);
    // match preview URL with any ref
    expect((await getProjectMatches(CONFIGS, 'https://baz--bar1--foo.hlx.page/')).length).to.equal(1);
    // match custom preview URL
    expect((await getProjectMatches(CONFIGS, 'https://6-preview.foo.bar/')).length).to.equal(1);
    // match live URL
    expect((await getProjectMatches(CONFIGS, 'https://main--bar1--foo.hlx.live/')).length).to.equal(1);
    // match custom live URL
    expect((await getProjectMatches(CONFIGS, 'https://6-live.foo.bar/')).length).to.equal(1);
    // match production host
    expect((await getProjectMatches(CONFIGS, 'https://1.foo.bar/')).length).to.equal(1);
    // ignore disabled config
    expect((await getProjectMatches(CONFIGS, 'https://main--bar2--foo.hlx.live/')).length).to.equal(0);
    // match transient URL
    expect((await getProjectMatches(CONFIGS, 'https://main--bar0--foo.hlx.live/')).length).to.equal(1);
    // testing else paths
    expect((await getProjectMatches(CONFIGS, 'https://bar--foo.hlx.live/')).length).to.equal(0);
    await urlCache.set('https://7.foo.bar/', { owner: 'foo', repo: 'bar6' });
    expect((await getProjectMatches(CONFIGS, 'https://7.foo.bar/')).length).to.equal(1);
    // match sharepoint URL (docx)
    mockDiscoveryCalls();
    await urlCache.set('https://foo.sharepoint.com/:w:/r/sites/foo/_layouts/15/Doc.aspx?sourcedoc=%7BBFD9A19C-4A68-4DBF-8641-DA2F1283C895%7D&file=index.docx&action=default&mobileredirect=true');
    expect((await getProjectMatches(CONFIGS, 'https://foo.sharepoint.com/:w:/r/sites/foo/_layouts/15/Doc.aspx?sourcedoc=%7BBFD9A19C-4A68-4DBF-8641-DA2F1283C895%7D&file=index.docx&action=default&mobileredirect=true')).length).to.equal(1);
    // match transient gdrive URL
    await urlCache.set('https://docs.google.com/document/d/1234567890/edit', { owner: 'foo', repo: 'bar0' });
    expect((await getProjectMatches(CONFIGS, 'https://docs.google.com/document/d/1234567890/edit')).length).to.equal(1);
  });

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
    const github = await getProjectFromUrl('https://github.com/adobe/blog/tree/stage');
    expect(github).to.eql(settings);
    const share = await getProjectFromUrl('https://www.aem.live/tools/sidekick/?giturl=https://github.com/adobe/blog/tree/stage');
    expect(share).to.eql(settings);
    const nomatch = await getProjectFromUrl('https://blog.adobe.com');
    expect(nomatch).to.eql({});
    urlCache.set('https://blog.adobe.com', settings);
    const cached = await getProjectFromUrl('https://blog.adobe.com');
    expect(cached).to.eql({ ...settings, ref: 'main' });
    const sharenogiturl = await getProjectFromUrl('https://www.aem.live/tools/sidekick/');
    expect(sharenogiturl).to.eql({});
    const shareinvalidgiturl = await getProjectFromUrl('https://www.aem.live/tools/sidekick/?giturl=https://www.example.com');
    expect(shareinvalidgiturl).to.eql({});
    // @ts-ignore
    const none = await getProjectFromUrl();
    expect(none).to.eql({});
  });
});
