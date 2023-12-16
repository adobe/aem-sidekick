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
import fetchMock from './mocks/fetch.js';
import {
  getProject,
  getProjects,
  getProjectEnv,
  assembleProject,
  addProject,
  updateProject,
  deleteProject,
} from '../../src/extension/project.js';

window.chrome = chromeMock;
window.fetch = fetchMock;

describe('Test utils', () => {
  const sandbox = sinon.createSandbox();

  before(async () => {
    await setUserAgent('HeadlessChrome');
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('getProject', async () => {
    const spy = sandbox.spy(window.chrome.storage.sync, 'get');
    // get project without handle
    let project = await getProject();
    expect(project).to.be.undefined;
    // get project with handle
    project = await getProject('adobe/blog');
    expect(spy.calledWith('adobe/blog')).to.be.true;
    expect(project.giturl).to.equal('https://github.com/adobe/blog');
    // get project with config object
    project = await getProject({ owner: 'adobe', repo: 'blog' });
    expect(spy.calledWith('adobe/blog')).to.be.true;
    expect(project.giturl).to.equal('https://github.com/adobe/blog');
  }).timeout(5000);

  it('getProjects', async () => {
    const spy = sandbox.spy(window.chrome.storage.sync, 'get');
    await getProjects();
    expect(spy.calledWith('hlxSidekickProjects')).to.be.true;
    expect(spy.calledWith('adobe/blog')).to.be.true;
  });

  it('getProjectEnv', async () => {
    const {
      host, project, mountpoints = [],
    } = await getProjectEnv({
      owner: 'adobe',
      repo: 'business-website',
    });
    expect(host).to.equal('business.adobe.com');
    expect(project).to.equal('Adobe Business Website');
    expect(mountpoints[0]).to.equal('https://adobe.sharepoint.com/:f:/s/Dummy/Alk9MSH25LpBuUWA_N6DOL8BuI6Vrdyrr87gne56dz3QeQ');
    // error handling
    sandbox.stub(window, 'fetch').throws();
    const error = await getProjectEnv({});
    expect(error).to.eql({});
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
    const spy = sandbox.spy(window.chrome.storage.sync, 'set');
    // add project
    const added = await addProject({
      giturl: 'https://github.com/test/project',
    });
    expect(added).to.be.true;
    expect(spy.calledWith({
      hlxSidekickProjects: ['adobe/blog', 'test/project'],
    })).to.be.true;
    // add project with auth enabled
    const addedWithAuth = await addProject({
      giturl: 'https://github.com/test/auth-project',
    });
    expect(addedWithAuth).to.be.true;
    expect(spy.calledWith({
      hlxSidekickProjects: ['adobe/blog', 'test/project', 'test/auth-project'],
    })).to.be.true;
    // add existing
    const addedExisting = await addProject({
      giturl: 'https://github.com/test/project',
    });
    expect(addedExisting).to.be.false;
  });

  it('updateProject', async () => {
    const spy = sandbox.spy(window.chrome.storage.sync, 'set');
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
    expect(spy.calledWith({
      'test/project': project,
    })).to.be.true;
    const invalid = await updateProject({ foo: 'bar' });
    expect(invalid).to.equal(null);
  });

  it('deleteProject', async () => {
    const spy = sandbox.spy(window.chrome.storage.sync, 'set');
    // delete project without handle
    let deleted = await deleteProject({ owner: 'adobe', repo: 'blog' });
    expect(deleted).to.be.true;
    expect(spy.calledWith({
      hlxSidekickProjects: ['test/project', 'test/auth-project'],
    })).to.be.true;
    // delete project with handle
    deleted = await deleteProject('test/project');
    expect(deleted).to.be.true;
    expect(spy.calledWith({
      hlxSidekickProjects: ['test/auth-project'],
    })).to.be.true;
    // delete inexistent project
    deleted = await deleteProject('test/project');
    expect(deleted).to.be.false;
  });
});
