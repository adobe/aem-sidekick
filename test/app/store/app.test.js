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
/* eslint-disable no-unused-expressions, no-import-assign, import/no-extraneous-dependencies */

// @ts-ignore
import fetchMock from 'fetch-mock/esm/client.js';
import sinon from 'sinon';
import {
  aTimeout, expect, waitUntil,
} from '@open-wc/testing';
import { AppStore, VIEWS } from '../../../src/extension/app/store/app.js';
import chromeMock from '../../mocks/chrome.js';
import {
  mockFetchConfigJSONNotFound,
  mockFetchConfigWithPluginsJSONSuccess,
  mockGdriveFetchStatusEditURLSuccess,
  mockFetchStatusNotFound,
  mockFetchStatusServerError,
  mockFetchStatusSuccess,
  mockFetchStatusUnauthorized,
  mockFetchProfileSuccess,
  mockFetchProfileUnauthorized,
  mockFetchProfileError,
  mockFetchConfigWithoutPluginsJSONSuccess,
} from '../../mocks/helix-admin.js';
import { mockFetchEnglishMessagesSuccess } from '../../mocks/i18n.js';
import { defaultSidekickConfig } from '../../fixtures/sidekick-config.js';
import { EventBus } from '../../../src/extension/app/utils/event-bus.js';
import { MODALS, MODAL_EVENTS } from '../../../src/extension/app/constants.js';
import { mockHelixEnvironment, restoreEnvironment } from '../../mocks/environment.js';
import { getAdminFetchOptions, getAdminUrl } from '../../../src/extension/app/utils/helix-admin.js';
import { recursiveQuery, error } from '../../test-utils.js';
import { AEMSidekick } from '../../../src/extension/index.js';
import { defaultSharepointProfileResponse, defaultSharepointStatusResponse } from '../../fixtures/helix-admin.js';

// @ts-ignore
window.chrome = chromeMock;

/**
 * The plugins
 * @typedef {import('@Types').ClientConfig} ClientConfig
 */

/**
 * The plugins
 * @typedef {import('@Types').SidekickConfig} SidekickConfig
 */

describe('Test App Store', () => {
  let sidekickElement;

  let appStore;

  beforeEach(() => {
    mockFetchStatusSuccess();
    mockFetchEnglishMessagesSuccess();
    mockFetchConfigJSONNotFound();
    sidekickElement = document.createElement('div');
    appStore = new AppStore();
  });

  afterEach(() => {
    fetchMock.restore();
  });

  async function testDefaultConfig() {
    expect(appStore.languageDict.add).to.equal('Add');
    expect(appStore.location.hostname).to.equal('localhost');
    expect(appStore.status.apiUrl.href).to.equal('https://admin.hlx.page/status/adobe/aem-boilerplate/main/?editUrl=auto');
    expect(appStore.languageDict.title).to.equal('AEM Sidekick - NextGen');

    await waitUntil(() => appStore.status.webPath, 'Status never loaded');
    expect(appStore.status.webPath).to.equal('/');
    expect(appStore.status.edit.status).to.equal(200);
    expect(appStore.status.live.status).to.equal(200);
  }

  it('loadContext - no config.json', async () => {
    const contextLoadedSpy = sinon.spy();
    sidekickElement.addEventListener('contextloaded', contextLoadedSpy);

    await appStore.loadContext(sidekickElement, defaultSidekickConfig);
    expect(contextLoadedSpy.calledOnce).to.be.true;
    await testDefaultConfig();
  });

  it('loadContext - with config.json and custom plugins', async () => {
    mockFetchConfigWithPluginsJSONSuccess();
    const contextLoadedSpy = sinon.spy();
    sidekickElement.addEventListener('contextloaded', contextLoadedSpy);

    await appStore.loadContext(sidekickElement, defaultSidekickConfig);
    expect(contextLoadedSpy.calledOnce).to.be.true;
    await testDefaultConfig();

    expect(appStore.siteStore.plugins.length).to.eq(9);
    expect(appStore.siteStore.scriptUrl).to.eq('https://www.hlx.live/tools/sidekick/index.js');
    expect(appStore.siteStore.host).to.eq('custom-host.com');
    expect(appStore.siteStore.innerHost).to.eq('custom-preview-host.com');
    expect(appStore.siteStore.liveHost).to.eq('custom-live-host.com');
    expect(appStore.siteStore.project).to.eq('AEM Boilerplate');
  });

  it('loadContext - unsupported lang, default to en', async () => {
    mockFetchConfigWithPluginsJSONSuccess();
    const contextLoadedSpy = sinon.spy();
    sidekickElement.addEventListener('contextloaded', contextLoadedSpy);

    const config = {
      ...defaultSidekickConfig,
      lang: 'abc',
    };

    await appStore.loadContext(sidekickElement, config);
    expect(contextLoadedSpy.calledOnce).to.be.true;
    await testDefaultConfig();

    expect(appStore.languageDict.title).to.eq('AEM Sidekick - NextGen');
  });

  it('isPreview()', async () => {
    await appStore.loadContext(sidekickElement, defaultSidekickConfig);
    appStore.location.port = '';

    appStore.location.host = 'main--aem-boilerplate--adobe.hlx.page';
    expect(appStore.isPreview()).to.be.true;

    appStore.location.host = 'main--aem-boilerplate--adobe.hlx.live';
    expect(appStore.isPreview()).to.be.false;

    appStore.location.host = 'main--aem-boilerplate--adobe.aem.page';
    expect(appStore.isPreview()).to.be.true;

    appStore.location.host = 'main--aem-boilerplate--adobe.aem.live';
    expect(appStore.isPreview()).to.be.false;

    appStore.location.host = 'foobar.com';
    expect(appStore.isPreview()).to.be.false;
  });

  it('isProd()', async () => {
    const config = {
      ...defaultSidekickConfig,
      host: 'aem-boilerplate.com',
    };

    await appStore.loadContext(sidekickElement, config);
    appStore.location.port = '';

    appStore.location.host = 'aem-boilerplate.com';
    expect(appStore.isProd()).to.be.true;

    appStore.location.host = 'main--aem-boilerplate--adobe.aem.live';
    expect(appStore.isProd()).to.be.false;
  });

  it('isAdmin()', async () => {
    await appStore.loadContext(sidekickElement, defaultSidekickConfig);
    appStore.location.port = '';

    appStore.location.host = 'main--aem-boilerplate--adobe.aem.live';
    expect(appStore.isAdmin()).to.be.false;

    appStore.location.host = 'drive.google.com';
    expect(appStore.isAdmin()).to.be.true;

    appStore.location.host = 'adobe-my.sharepoint.com';
    appStore.location.pathname = '/personal/foobar_adobe_com/_layouts/15/onedrive.aspx';
    appStore.location.search = '?id=%2Fpersonal%2Ffoobar_adobe_com%2FDocuments%2Faem-boilerplate&view=0';
    expect(appStore.isAdmin()).to.be.true;
  });

  it('isProject()', async () => {
    const config = {
      ...defaultSidekickConfig,
      host: 'aem-boilerplate.com',
    };

    await appStore.loadContext(sidekickElement, config);
    appStore.location.port = '3000';

    appStore.location.host = 'localhost';
    expect(appStore.isProject()).to.be.true;

    appStore.location.port = '';
    appStore.location.host = 'main--aem-boilerplate--adobe.aem.live';
    expect(appStore.isProject()).to.be.true;

    appStore.location.host = 'main--aem-boilerplate--adobe.aem.page';
    expect(appStore.isProject()).to.be.true;

    appStore.location.host = 'aem-boilerplate.com';
    expect(appStore.isProject()).to.be.true;

    appStore.location.host = 'foo.com';
    expect(appStore.isProject()).to.be.false;
  });

  it('isEditor()', async () => {
    const config = {
      ...defaultSidekickConfig,
      mountpoint: 'https://docs.google.com/document/d/doc-id/edit',
      host: 'aem-boilerplate.com',
    };

    await appStore.loadContext(sidekickElement, config);
    appStore.location.port = '';

    appStore.location.host = 'adobe-my.sharepoint.com';
    appStore.location.pathname = '/:w:/r/personal/directory/_layouts/15/Doc.aspx';
    appStore.location.search = '?sourcedoc=AABBCC&file=about.docx&action=default&mobileredirect=true';
    expect(appStore.isEditor()).to.be.true;

    appStore.location.pathname = '';
    appStore.location.search = '';
    appStore.location.host = 'docs.google.com';
    expect(appStore.isEditor()).to.be.true;
  });

  it('isSharePointFolder()', async () => {
    await appStore.loadContext(sidekickElement, defaultSidekickConfig);
    appStore.location.port = '';

    // test with id param
    let url = new URL('https://foo.sharepoint.com/sites/foo/Shared%20Documents/Forms/AllItems.aspx?id=%2Fsites%2Ffoo%2FShared%20Documents%2Fsite&viewid=87cb4d37%2D30e2%2D4762%2D87ef%2D5cd0e1059250');
    expect(appStore.isSharePointFolder(url)).to.be.true;
    // test with RootFolder param
    url = new URL('https://foo.sharepoint.com/sites/foo/Shared%20Documents/Forms/AllItems.aspx?RootFolder=%2Fsites%2Ffoo%2FShared%20Documents%2Fsite&viewid=87cb4d37%2D30e2%2D4762%2D87ef%2D5cd0e1059250');
    expect(appStore.isSharePointFolder(url)).to.be.true;
    // test with no param
    url = new URL('https://foo.sharepoint.com/sites/foo/Shared%20Documents/Forms/AllItems.aspx');
    expect(appStore.isSharePointFolder(url)).to.be.true;
  });

  it('isSharePointViewer()', async () => {
    await appStore.loadContext(sidekickElement, defaultSidekickConfig);
    appStore.location.port = '';

    const url = new URL('https://adobe-my.sharepoint.com/personal/directory/_layouts/15/onedrive.aspx?id=%2Ffoobar%2Ejpg');
    expect(appStore.isSharePointViewer(url)).to.be.true;
  });

  describe('isAuthenticated()', () => {
    it('not authenticated', async () => {
      await appStore.loadContext(sidekickElement, defaultSidekickConfig);
      await waitUntil(
        () => appStore.status.webPath,
        'Status never loaded',
      );

      expect(appStore.isAuthenticated()).to.be.false;
    });

    it('authenticated', async () => {
      mockFetchStatusSuccess({ profile: { name: 'foo' } });
      await appStore.loadContext(sidekickElement, defaultSidekickConfig);
      await waitUntil(
        () => appStore.status.webPath,
        'Status never loaded',
      );

      expect(appStore.isAuthenticated()).to.be.true;
    });
  });

  it('isAuthorized()', async () => {
    await appStore.loadContext(sidekickElement, defaultSidekickConfig);
    await waitUntil(
      () => appStore.status.webPath,
      'Status never loaded',
    );

    expect(appStore.isAuthorized('not-a-feature', 'delete')).to.be.false;
    expect(appStore.isAuthorized('preview', 'delete')).to.be.false;
    expect(appStore.isAuthorized('preview', 'read')).to.be.true;
    expect(appStore.isAuthorized('links', 'read')).to.be.true;
  });

  it('isContent()', async () => {
    await appStore.loadContext(sidekickElement, defaultSidekickConfig);
    appStore.location.pathname = '/test.png';
    expect(appStore.isContent()).to.be.true;

    appStore.location.pathname = '/test.ico';
    expect(appStore.isContent()).to.be.false;
  });

  describe('fetchStatus()', async () => {
    it('success', async () => {
      mockFetchStatusSuccess();
      await appStore.loadContext(sidekickElement, defaultSidekickConfig);
      await appStore.fetchStatus(true);
      await waitUntil(
        () => appStore.status.webPath,
        'Status never loaded',
      );
      expect(appStore.status.webPath).to.equal('/');
    });

    it('success - editor', async () => {
      mockGdriveFetchStatusEditURLSuccess();
      sinon.stub(appStore, 'isEditor').returns(true);
      await appStore.loadContext(sidekickElement, defaultSidekickConfig);
      await appStore.fetchStatus();
      await waitUntil(
        () => appStore.status.webPath,
        'Status never loaded',
      );
      expect(appStore.status.webPath).to.equal('/');
    });

    it('unauthorized', async () => {
      mockFetchStatusUnauthorized();
      await appStore.loadContext(sidekickElement, defaultSidekickConfig);
      await waitUntil(
        () => appStore.status.status,
        'Status never loaded',
      );
      expect(appStore.status.status).to.equal(401);
    });

    it('not found', async () => {
      mockFetchStatusNotFound();
      await appStore.loadContext(sidekickElement, defaultSidekickConfig);
      await waitUntil(
        () => appStore.status.error,
        'Status never loaded',
      );
      expect(appStore.status.error).to.equal('error_status_404_content');
    });

    it('not found - editor', async () => {
      mockFetchStatusNotFound();
      await appStore.loadContext(sidekickElement, defaultSidekickConfig);

      appStore.location.href = 'https://adobe-my.sharepoint.com/:w:/r/personal/directory/_layouts/15/Doc.aspx?sourcedoc=ABC&file=about.docx';
      await appStore.fetchStatus();
      await waitUntil(
        () => appStore.status.error,
        'Status never loaded',
      );
      expect(appStore.status.error).to.equal('error_status_404_document');
    });

    it('server error', async () => {
      mockFetchStatusServerError();
      await appStore.loadContext(sidekickElement, defaultSidekickConfig);
      await waitUntil(
        () => appStore.status.error,
        'Status never loaded',
      );
      expect(appStore.status.error).to.equal('error_status_500');
    });
  });

  describe('wait dialog', async () => {
    it('showWait()', async () => {
      appStore.sidekick = document.createElement('div');
      appStore.sidekick.attachShadow({ mode: 'open' });
      appStore.sidekick.shadowRoot.appendChild(document.createElement('theme-wrapper'));

      const modalSpy = sinon.spy(appStore, 'showModal');
      const modalElement = appStore.showWait('test');
      expect(modalElement.nodeName).to.equal('MODAL-CONTAINER');
      expect(modalSpy.calledOnce).to.be.true;
      expect(modalSpy.args[0][0]).to.deep.equal({
        type: MODALS.WAIT,
        data: { message: 'test' },
      });
    });

    it('hideWait()', async () => {
      const callback = sinon.spy();
      const eventBus = EventBus.instance;
      eventBus.addEventListener(MODAL_EVENTS.CLOSE, callback);
      appStore.hideWait();
      expect(callback.calledOnce).to.be.true;
    });
  });

  describe('show toast', async () => {
    it('showToast()', async () => {
      appStore.sidekick = document.createElement('div');
      appStore.sidekick.attachShadow({ mode: 'open' });
      appStore.sidekick.shadowRoot.appendChild(document.createElement('theme-wrapper'));

      const toastSpy = sinon.spy(appStore, 'showToast');
      const toastElement = appStore.showToast('test', 'info', 2000);
      expect(toastElement.nodeName).to.equal('TOAST-CONTAINER');
      expect(toastSpy.calledOnce).to.be.true;
      expect(toastSpy.args[0][0]).to.equal('test');
      expect(toastSpy.args[0][1]).to.equal('info');
      expect(toastSpy.args[0][2]).to.equal(2000);
    });
  });

  describe('reloadPage', async () => {
    const sandbox = sinon.createSandbox();
    let openPageStub;
    let loadPageStub;

    beforeEach(() => {
      openPageStub = sandbox.stub(appStore, 'openPage');
      loadPageStub = sandbox.stub(appStore, 'loadPage');
    });

    afterEach(() => {
      sandbox.restore();
    });

    it('opens a new tab', async () => {
      appStore.reloadPage(true);
      expect(openPageStub.calledOnce).to.be.true;
    });

    it('reloads the current tab', async () => {
      appStore.reloadPage();
      expect(loadPageStub.calledOnce).to.be.true;
    });
  });

  describe('switchEnv', async () => {
    const mockStatus = defaultSharepointStatusResponse;
    const sandbox = sinon.createSandbox();
    let openPage;
    let loadPage;
    let instance;

    beforeEach(() => {
      sandbox.stub(window, 'fetch').resolves(new Response(JSON.stringify({
        webPath: '/somepath',
      })));
      instance = appStore;
      instance.siteStore = {
        owner: 'adobe',
        repo: 'aem-boilerplate',
        ref: 'main',
        innerHost: new URL(mockStatus.preview.url).hostname,
        outerHost: new URL(mockStatus.live.url).hostname,
        devUrl: new URL('https://localhost:3000'),
        views: [{
          path: '**.json',
          viewer: '/test/wtr/fixtures/views/json/json.html',
        }],
      };

      // Mock other functions
      sandbox.stub(instance, 'fireEvent');

      openPage = sandbox.spy();
      loadPage = sandbox.spy();
      sandbox.stub(instance, 'openPage').callsFake(openPage);
      sandbox.stub(instance, 'loadPage').callsFake(loadPage);
    });

    afterEach(() => {
      sandbox.restore();
    });

    it('switches from editor to preview', async () => {
      instance.location = new URL(mockStatus.edit.url);
      instance.status = mockStatus;
      await instance.switchEnv('preview');
      expect(openPage.calledWith(mockStatus.preview.url)).to.be.true;
    });

    it('switches from preview to editor', async () => {
      instance.location = new URL(mockStatus.preview.url);
      instance.status = mockStatus;
      await instance.switchEnv('edit');
      expect(loadPage.calledWith(mockStatus.edit.url)).to.be.true;
    });

    it('switches from live to preview', async () => {
      instance.location = new URL(mockStatus.live.url);
      instance.status = mockStatus;
      await instance.switchEnv('preview');
      expect(loadPage.calledWith(mockStatus.preview.url)).to.be.true;
    });

    it('switches from preview to live opening a new window', async () => {
      instance.location = new URL(mockStatus.preview.url);
      instance.status = mockStatus;
      await instance.switchEnv('live', true);
      expect(openPage.calledWith(mockStatus.live.url)).to.be.true;
    });

    it('switches from preview to dev', async () => {
      instance.location = new URL(mockStatus.live.url);
      instance.status = mockStatus;
      await instance.switchEnv('dev');
      const devUrl = new URL(
        new URL(mockStatus.preview.url).pathname,
        'https://localhost:3000',
      );
      expect(loadPage.calledWith(devUrl.href)).to.be.true;
    });

    it('switches to live instead of prod', async () => {
      instance.location = new URL(mockStatus.preview.url);
      instance.status = mockStatus;
      await instance.switchEnv('prod');
      expect(loadPage.calledWith(mockStatus.live.url)).to.be.true;
    });

    it('aborts on invaid target env', async () => {
      instance.location = new URL(mockStatus.preview.url);
      instance.status = mockStatus;
      await instance.switchEnv('foo');
      expect(openPage.calledOnce).to.be.false;
      expect(loadPage.calledOnce).to.be.false;
    });

    it('aborts on status error', async () => {
      instance.location = new URL(mockStatus.preview.url);
      instance.status.error = 'some error occurred';
      await instance.switchEnv('live');
      expect(openPage.calledOnce).to.be.false;
      expect(loadPage.calledOnce).to.be.false;
    });

    it('retries if status not ready yet', async () => {
      const consoleSpy = sandbox.spy(console, 'log');
      instance.location = new URL(mockStatus.preview.url);
      instance.status = {};
      await instance.switchEnv('live');
      expect(consoleSpy.calledWith('not ready yet, trying again in a second ...')).to.be.true;
    });
  });

  describe('update', async () => {
    let sandbox;
    let fakeFetch;
    let instance;

    beforeEach(() => {
      sandbox = sinon.createSandbox();
      fakeFetch = sandbox.stub(window, 'fetch');
      instance = appStore;

      // Mock other functions
      sandbox.stub(instance, 'isContent');
      sandbox.stub(instance, 'isEditor');
      sandbox.stub(instance, 'isPreview');
      sandbox.stub(instance, 'isDev');
      sandbox.stub(instance, 'fireEvent');
    });

    afterEach(() => {
      sandbox.restore();
    });

    it('should handle successful update for content w/path', async () => {
      instance.isContent.returns(true);

      const headers = new Headers();

      fakeFetch.resolves({
        ok: true, status: 200, headers, json: () => Promise.resolve({ webPath: '/somepath' }),
      });

      const response = await instance.update('/ignored-path');

      expect(response).to.deep.equal({
        ok: true,
        status: 200,
        error: '',
        path: '/somepath',
      });
      sinon.assert.calledWith(instance.fireEvent, 'updated', '/somepath');
      sinon.assert.calledWith(instance.fireEvent, 'previewed', '/somepath');
    });

    it('should handle successful update for content wo/path', async () => {
      instance.isContent.returns(true);

      const headers = new Headers();

      fakeFetch.resolves({
        ok: true, status: 200, headers, json: () => Promise.resolve({ webPath: '/somepath' }),
      });

      const response = await instance.update();

      expect(response).to.deep.equal({
        ok: true,
        status: 200,
        error: '',
        path: '/somepath',
      });
      sinon.assert.calledWith(instance.fireEvent, 'updated', '/somepath');
      sinon.assert.calledWith(instance.fireEvent, 'previewed', '/somepath');
    });

    it('should bust client cache', async () => {
      instance.isEditor.returns(true);

      instance.siteStore.innerHost = 'main--aem-boilerplate--adobe.hlx.page';

      const headers = new Headers();

      fakeFetch.resolves({
        ok: true, status: 200, headers, json: () => Promise.resolve({ webPath: '/somepath' }),
      });

      const response = await instance.update('/testpath');

      expect(response).to.deep.equal({
        ok: true,
        status: 200,
        error: '',
        path: '/somepath',
      });

      sinon.assert.calledWith(instance.fireEvent, 'updated', '/somepath');
      expect(fakeFetch.args[1][0]).to.equal('https://main--aem-boilerplate--adobe.hlx.page/testpath');
      expect(fakeFetch.args[1][1]).to.deep.equal({ cache: 'reload', mode: 'no-cors' });
    });

    it('should handle successful update for code', async () => {
      instance.isContent.returns(false);

      const headers = new Headers();

      fakeFetch.resolves({
        ok: true, status: 200, headers, json: () => Promise.resolve({ webPath: '/somepath' }),
      });

      const response = await instance.update('/ignored-path');

      expect(response).to.deep.equal({
        ok: true,
        status: 200,
        error: '',
        path: '/somepath',
      });
      sinon.assert.calledWith(instance.fireEvent, 'updated', '/somepath');
    });

    it('should handle fetch error', async () => {
      fakeFetch.rejects(new Error('Network failure'));

      const response = await instance.update('/testpath');

      expect(response).to.deep.equal({
        ok: false,
        status: 0,
        error: '',
        path: '/testpath',
      });
    });

    it('should handle non-OK response from fetch', async () => {
      fakeFetch.resolves({ ok: false, status: 404, headers: { get: () => 'Not Found' } });

      const response = await instance.update('/testpath');

      expect(response).to.deep.equal({
        ok: false,
        status: 404,
        error: 'Not Found',
        path: '/testpath',
      });
    });
  });

  describe('updatePreview', () => {
    let instance;
    let sandbox;
    let updateStub;
    let showWaitStub;
    let hideWaitStub;
    let fetchStatusStub;
    let switchEnvStub;
    let showToastStub;
    let updatePreviewSpy;
    let addEventListenerSpy;
    let modalSpy;

    beforeEach(() => {
      instance = appStore;
      sandbox = sinon.createSandbox();
      instance.sidekick = document.createElement('div');
      updateStub = sandbox.stub(instance, 'update');
      showWaitStub = sandbox.stub(instance, 'showWait');
      hideWaitStub = sandbox.stub(instance, 'hideWait');
      fetchStatusStub = sandbox.stub(instance, 'fetchStatus');
      switchEnvStub = sandbox.stub(instance, 'switchEnv');
      showToastStub = sandbox.stub(instance, 'showToast');
      updatePreviewSpy = sandbox.spy(instance, 'updatePreview');
      addEventListenerSpy = sandbox.spy(instance.sidekick, 'addEventListener');
      modalSpy = sandbox.spy(instance, 'showModal');
    });

    afterEach(() => {
      sandbox.restore();
    });

    it('should show wait, update, and handle success response', async () => {
      updateStub.resolves({ ok: true });
      instance.status = { webPath: '/somepath' };

      await instance.updatePreview(false);

      expect(showWaitStub.called).is.true;
      expect(hideWaitStub.called).is.true;
      expect(switchEnvStub.calledWith('preview')).is.true;
    });

    // Test when resp is not ok, ranBefore is false
    it('should handle failure response without ranBefore', async () => {
      updateStub.resolves({ ok: false });
      instance.status = { webPath: '/somepath' };

      await instance.updatePreview(false);

      expect(showWaitStub.called).is.true;
      expect(addEventListenerSpy.called).is.true;
      expect(fetchStatusStub.called).is.true;

      instance.sidekick.dispatchEvent(new CustomEvent('statusfetched', { detail: { status: { webPath: '/somepath' } } }));
      await waitUntil(() => updatePreviewSpy.calledTwice);
    });

    // Test when resp is not ok, ranBefore is true, status.webPath
    // starts with /.helix/, resp has error
    it('should handle failure with specific path and error', async () => {
      updateStub.resolves({ ok: false, error: 'Error message' });
      instance.status = { webPath: '/.helix/some-path' };

      await instance.updatePreview(true);

      expect(showWaitStub.called).is.true;
      expect(modalSpy.calledWith(sinon.match.has('type', MODALS.ERROR))).is.true;
    });

    // Test when resp is not ok, ranBefore is true, status.webPath
    // does not start with /.helix/, or resp has no error
    it('should handle generic failure', async () => {
      updateStub.resolves({ ok: false });
      instance.status = { webPath: '/not-helix/' };

      await instance.updatePreview(true);

      expect(showWaitStub.called).is.true;
      expect(modalSpy.calledWith(sinon.match.has('type', MODALS.ERROR))).is.true;
    });

    // Test when resp is ok and status.webPath starts with /.helix/
    it('should handle success with specific path', async () => {
      updateStub.resolves({ ok: true });
      instance.status = { webPath: '/.helix/some-path' };

      await instance.updatePreview(false);

      expect(showWaitStub.called).is.true;
      expect(hideWaitStub.called).is.true;
      expect(showToastStub.calledWith(sinon.match.string, 'positive')).is.true;
    });

    // Test when resp is ok and status.webPath does not start with /.helix/
    it('should handle generic success', async () => {
      updateStub.resolves({ ok: true });
      instance.status = { webPath: '/not-helix/' };

      await instance.updatePreview(false);

      expect(showWaitStub.called).is.true;
      expect(hideWaitStub.called).is.true;
      expect(switchEnvStub.calledWith('preview')).is.true;
    });
  });

  describe('delete', async () => {
    const deletePath = '/delete-path';

    let sandbox;
    let fakeFetch;
    let instance;

    beforeEach(() => {
      sandbox = sinon.createSandbox();
      fakeFetch = sandbox.stub(window, 'fetch');
      instance = appStore;

      // Mock other functions
      sandbox.stub(instance, 'isContent');
      sandbox.stub(instance, 'isEditor');
      sandbox.stub(instance, 'isPreview');
      sandbox.stub(instance, 'isDev');
      sandbox.stub(instance, 'fireEvent');
    });

    afterEach(() => {
      sandbox.restore();
    });

    it('deletes unpublished content from preview', async () => {
      instance.isContent.returns(true);
      instance.status = { webPath: deletePath };

      const headers = new Headers();

      fakeFetch.resolves({
        ok: true, status: 200, headers, json: () => Promise.resolve({}),
      });

      const resp = await instance.delete();

      expect(resp.path).to.equal(deletePath);
      expect(resp.error).to.equal('');
      sinon.assert.calledWith(instance.fireEvent, 'deleted', deletePath);
    });

    it('deletes published content from preview and live', async () => {
      const unpublishStub = sandbox.stub(instance, 'unpublish');
      instance.isContent.returns(true);
      instance.status = {
        webPath: deletePath,
        live: {
          lastModified: '2023-01-01T00:00:00Z',
        },
      };

      const headers = new Headers();

      fakeFetch.resolves({
        ok: true, status: 200, headers, json: () => Promise.resolve({}),
      });

      const resp = await instance.delete();

      expect(resp.path).to.equal(deletePath);
      expect(resp.error).to.equal('');
      expect(unpublishStub.calledOnce).to.be.true;
      sinon.assert.calledWith(instance.fireEvent, 'deleted', deletePath);
    });

    it('only deletes content', async () => {
      instance.isContent.returns(false);
      instance.status = {
        webPath: deletePath,
      };

      const resp = await instance.delete();

      expect(resp).to.equal(null);
      expect(fakeFetch.called).to.be.false;
    });

    it('handles network error', async () => {
      const consoleSpy = sandbox.spy(console, 'log');
      instance.isContent.returns(true);
      instance.status = { webPath: deletePath };

      fakeFetch.throws(error);

      const response = await instance.delete();

      expect(response.error).to.equal(error.message);
      expect(consoleSpy.calledWith('failed to delete', deletePath, error)).to.be.true;
    });
  });

  describe('publish', () => {
    let instance;
    let isContentStub;
    let isEditorStub;
    let fetchStub;
    let fireEventStub;

    beforeEach(() => {
      instance = appStore;
      isContentStub = sinon.stub(instance, 'isContent');
      isEditorStub = sinon.stub(instance, 'isEditor');
      // @ts-ignore
      fetchStub = sinon.stub(window, 'fetch').resolves({ headers: new Headers(), ok: true, status: 200 });
      fireEventStub = sinon.stub(instance, 'fireEvent');
    });

    afterEach(() => {
      sinon.restore();
      restoreEnvironment(document);
    });

    it('should return null if isContent is false', async () => {
      isContentStub.returns(false);

      const result = await instance.publish('/somepath');

      expect(result).is.null;
    });

    it('should handle successful publish', async () => {
      mockHelixEnvironment(document, 'preview');
      isContentStub.returns(true);
      instance.siteStore = { innerHost: 'main--aem-boilerplate--adobe.hlx.page', outerHost: 'main--aem-boilerplate--adobe.hlx.live', host: 'host' };
      instance.location = { href: 'https://aem-boilerplate.com', host: 'aem-boilerplate.com' };

      const resp = await instance.publish('/somepath');

      expect(fetchStub.called).is.true;
      expect(fireEventStub.calledWith('published', '/somepath')).is.true;
      expect(resp.path).to.eq('/somepath');
      expect(resp.error).to.eq('');
    });

    it('should handle fetch errors', async () => {
      isContentStub.returns(true);
      fetchStub.rejects(new Error());
      instance.siteStore = { owner: 'adobe', repo: 'aem-boilerplate' };
      instance.location = { href: 'https://aem-boilerplate.com', host: 'aem-boilerplate.com' };

      const resp = await instance.publish('/somepath');

      expect(fetchStub.called).is.true;
      expect(resp.path).to.eq('/somepath');
      expect(resp.error).to.eq('');
    });

    it('should handle publish when outerHost is defined', async () => {
      isContentStub.returns(true);
      instance.siteStore = { innerHost: 'main--aem-boilerplate--adobe.hlx.page', outerHost: 'main--aem-boilerplate--adobe.hlx.live' };
      instance.location = { href: 'https://aem-boilerplate.com', host: 'aem-boilerplate.com' };

      await instance.publish('/somepath');

      expect(fetchStub.calledWith('https://main--aem-boilerplate--adobe.hlx.live/somepath', sinon.match.has('cache', 'reload'))).is.true;
    });

    it('should purge host', async () => {
      isContentStub.returns(true);
      isEditorStub.returns(true);
      instance.siteStore = { innerHost: 'main--aem-boilerplate--adobe.hlx.page', host: 'aem-boilerplate.com' };
      instance.location = { href: 'https://aem-boilerplate.com', host: 'aem-boilerplate.com' };

      await instance.publish('/somepath');

      expect(fetchStub.args[1][0]).to.equal('https://aem-boilerplate.com/somepath');
      expect(fetchStub.args[1][1]).to.deep.equal({ cache: 'reload', mode: 'no-cors' });
    });

    it('should handle publish when host is defined', async () => {
      isContentStub.returns(true);
      instance.siteStore = { innerHost: 'main--aem-boilerplate--adobe.hlx.page', host: 'aem-boilerplate.com' };
      instance.location = { href: 'https://aem-boilerplate.com', host: 'aem-boilerplate.com' };

      await instance.publish('/somepath');
      expect(fetchStub.calledWith('https://aem-boilerplate.com/somepath', sinon.match.has('cache', 'reload'))).is.true;
    });

    it('should use correct parameters for fetch call', async () => {
      isContentStub.returns(true);
      instance.siteStore = { innerHost: 'main--aem-boilerplate--adobe.hlx.page' };
      instance.location = { href: 'https://aem-boilerplate.com', host: 'aem-boilerplate.com' };
      const expectedUrl = getAdminUrl(instance.siteStore, 'live', '/somepath');
      const expectedOptions = getAdminFetchOptions();

      await instance.publish('/somepath');

      expect(fetchStub.calledWith(expectedUrl, sinon.match(expectedOptions))).is.true;
    });

    it('should properly set error from response headers', async () => {
      isContentStub.returns(true);
      instance.siteStore = { owner: 'adobe', repo: 'aem-boilerplate' };
      instance.location = { href: 'https://aem-boilerplate.com', host: 'aem-boilerplate.com' };

      const headers = new Headers();
      headers.append('x-error', 'Some error');
      const mockResponse = {
        ok: false,
        headers,
      };
      fetchStub.resolves(mockResponse);

      const resp = await instance.publish('/somepath');

      expect(resp.error).to.eq('Some error');
    });
  });

  describe('unpublish', async () => {
    const unpublishPath = '/unpublish-path';
    let sandbox;
    let fakeFetch;
    let instance;

    beforeEach(() => {
      sandbox = sinon.createSandbox();
      fakeFetch = sandbox.stub(window, 'fetch');
      instance = appStore;

      // Mock other functions
      sandbox.stub(instance, 'isContent');
      sandbox.stub(instance, 'isEditor');
      sandbox.stub(instance, 'isPreview');
      sandbox.stub(instance, 'isDev');
      sandbox.stub(instance, 'fireEvent');
    });

    afterEach(() => {
      sandbox.restore();
    });

    it('deletes content from live', async () => {
      instance.isContent.returns(true);
      instance.status = { webPath: unpublishPath };

      const headers = new Headers();

      fakeFetch.resolves({
        ok: true, status: 200, headers, json: () => Promise.resolve({}),
      });

      const resp = await instance.unpublish();

      expect(resp.path).to.equal(unpublishPath);
      expect(resp.error).to.equal('');
      sinon.assert.calledWith(instance.fireEvent, 'unpublished', unpublishPath);
    });

    it('only unpublishes content', async () => {
      instance.isContent.returns(false);
      instance.status = {
        webPath: unpublishPath,
      };

      const resp = await instance.unpublish();

      expect(resp).to.equal(null);
      expect(fakeFetch.called).to.be.false;
    });

    it('handles network error', async () => {
      const consoleSpy = sandbox.spy(console, 'log');
      instance.isContent.returns(true);
      instance.status = { webPath: unpublishPath };

      fakeFetch.throws(error);

      const resp = await instance.unpublish();

      expect(resp.error).to.equal(error.message);
      expect(consoleSpy.calledWithMatch('failed to unpublish', unpublishPath, error)).to.be.true;
    });
  });

  describe('plugin preferences', () => {
    const sandbox = sinon.createSandbox();
    let instance;
    let isEditorStub;
    let isPreviewStub;
    let isLiveStub;
    let isProdStub;
    let isDevStub;
    let isAdminStub;
    let syncStorageGetStub;
    let syncStorageSetStub;

    beforeEach(() => {
      instance = appStore;
      isEditorStub = sandbox.stub(instance, 'isEditor');
      isPreviewStub = sandbox.stub(instance, 'isPreview');
      isLiveStub = sandbox.stub(instance, 'isLive');
      isProdStub = sandbox.stub(instance, 'isProd');
      isDevStub = sandbox.stub(instance, 'isDev');
      isAdminStub = sandbox.stub(instance, 'isAdmin');
      isEditorStub.returns(false);
      isPreviewStub.returns(false);
      isLiveStub.returns(false);
      isProdStub.returns(false);
      isDevStub.returns(false);
      isAdminStub.returns(false);

      syncStorageGetStub = sandbox.stub(chrome.storage.sync, 'get');
      syncStorageSetStub = sandbox.stub(chrome.storage.sync, 'set');
      syncStorageSetStub.resolves();
    });

    afterEach(() => {
      sandbox.restore();
      restoreEnvironment(document);
      fetchMock.restore();
    });

    it('sets plugin preferences for an env', async () => {
      mockFetchStatusSuccess();
      mockHelixEnvironment(document, 'preview');
      isPreviewStub.returns(true);

      // no stored prefs
      syncStorageGetStub.resolves({});
      await instance.initSettings();

      await instance.setPluginPrefs('plugin1', { test: 1 });
      expect(syncStorageSetStub.called).is.true;
      expect(instance.getPluginPrefs('plugin1').test).to.equal(1);

      // stored prefs for different env
      syncStorageGetStub.resolves({
        pluginPrefs: {
          live: {
            plugin2: {
              pinned: true,
            },
          },
        },
      });

      await instance.setPluginPrefs('plugin2', { test: 1 });
      expect(syncStorageSetStub.called).is.true;
      expect(instance.getPluginPrefs('plugin2').test).to.equal(1);

      // stored prefs for this env
      syncStorageGetStub.resolves({
        pluginPrefs: {
          preview: {
            plugin3: {
              pinned: true,
            },
          },
        },
      });

      await instance.setPluginPrefs('plugin3', { test: { foo: true } });
      expect(syncStorageSetStub.called).is.true;
      expect(instance.getPluginPrefs('plugin3').test).to.deep.equal({ foo: true });
    });

    it('retrieves plugin preferences for an env', async () => {
      mockFetchStatusSuccess();
      mockHelixEnvironment(document, 'preview');
      isPreviewStub.returns(true);

      // return empty object if no stored prefs yet
      expect(instance.getPluginPrefs('foo')).to.deep.equal({});

      // stored prefs for different env
      syncStorageGetStub.resolves({
        pluginPrefs: {
          live: {
            foo: {
              pinned: true,
            },
          },
        },
      });
      await instance.initSettings();
      expect(instance.getPluginPrefs('foo')).to.deep.equal({});

      // stored prefs for this env, but different plugin
      syncStorageGetStub.resolves({
        pluginPrefs: {
          preview: {
            bar: {
              pinned: true,
            },
          },
        },
      });
      await instance.initSettings();
      expect(instance.getPluginPrefs('foo')).to.deep.equal({});

      // stored prefs for this env and plugin
      syncStorageGetStub.resolves({
        pluginPrefs: {
          preview: {
            foo: {
              pinned: true,
            },
          },
        },
      });
      await instance.initSettings();
      expect(instance.getPluginPrefs('foo').pinned).is.true;
    });
  });

  describe('findViews', () => {
    let instance;

    beforeEach(() => {
      instance = appStore;
      instance.status = { webPath: '/some.json' };
      instance.siteStore = {
        views: [
          { path: '**.json', viewer: '/test/fixtures/views/json/json.html' },
        ],
      };
    });

    afterEach(() => {
      sinon.restore(); // Restore original functions
    });

    it('should return an empty array if testPath and webPath are not provided', () => {
      instance.status.webPath = null;
      const result = instance.findViews(VIEWS.CUSTOM);
      expect(result).to.deep.equal([]);
    });

    it('should use webPath as testPath if not provided', () => {
      const [view] = instance.findViews(VIEWS.DEFAULT);
      expect(view.path).to.equal('**.json');
      expect(view.viewer).to.equal('/test/fixtures/views/json/json.html');
    });

    it('should use testPath', () => {
      const [view] = instance.findViews(VIEWS.DEFAULT, '/foo.json');
      expect(view.path).to.equal('**.json');
      expect(view.viewer).to.equal('/test/fixtures/views/json/json.html');
    });

    it('should filter views based on DEFAULT viewType', () => {
      const [view] = instance.findViews(VIEWS.DEFAULT);
      expect(view.path).to.equal('**.json');
      expect(view.viewer).to.equal('/test/fixtures/views/json/json.html');
    });

    it('should filter views based on CUSTOM viewType (no custom)', () => {
      const result = instance.findViews(VIEWS.CUSTOM);
      expect(result.length).to.equal(0);
    });

    it('should filter views based on CUSTOM viewType (with custom)', () => {
      instance.status = { webPath: '/some.psd' };
      instance.siteStore = {
        views: [
          { path: '**.json', viewer: '/test/fixtures/views/json/json.html' },
          { path: '**.psd', viewer: 'https://example.com/psd-renderer.html' },
        ],
      };
      const [view] = instance.findViews(VIEWS.CUSTOM);
      expect(view.path).to.equal('**.psd');
      expect(view.viewer).to.equal('https://example.com/psd-renderer.html');
    });

    it('should include all matching views if viewType is neither DEFAULT nor CUSTOM', () => {
      instance.siteStore = {
        views: [
          { path: '**.json', viewer: '/test/fixtures/views/json/json.html' },
          { path: '**.psd', viewer: 'https://example.com/psd-renderer.html' },
        ],
      };
      const [view] = instance.findViews();
      expect(view.path).to.equal('**.json');
      expect(view.viewer).to.equal('/test/fixtures/views/json/json.html');
    });
  });

  describe('getViewOverlay', () => {
    let instance;
    let sandbox;

    beforeEach(() => {
      instance = appStore;
      sandbox = sinon.createSandbox();
      const shadowRoot = sidekickElement.attachShadow({ mode: 'open' });
      shadowRoot.appendChild(document.createElement('div'));
    });

    afterEach(() => {
      sandbox.restore();
    });

    it('returns an existing view without creating a new one', async () => {
      await appStore.loadContext(sidekickElement, defaultSidekickConfig);
      const existingView = document.createElement('div');
      existingView.classList.add('hlx-sk-special-view');
      sidekickElement.shadowRoot.appendChild(existingView);

      const view = instance.getViewOverlay(false);
      expect(view).to.equal(existingView);
    });

    it('creates and returns a new view when none exists and create is true', async () => {
      await appStore.loadContext(sidekickElement, defaultSidekickConfig);
      const view = instance.getViewOverlay(true);
      expect(view.classList.contains('hlx-sk-special-view')).to.be.true;
      expect(instance.sidekick.shadowRoot.querySelector('.hlx-sk-special-view')).to.equal(view);
    });

    it('adds an iframe to the new view with the correct attributes', async () => {
      await appStore.loadContext(sidekickElement, defaultSidekickConfig);
      const view = instance.getViewOverlay(true);
      const iframe = view.querySelector('iframe.container');
      expect(iframe).to.not.be.null;
      expect(iframe.getAttribute('allow')).to.equal('clipboard-write *');
    });

    it('removes the view and resets siblings display on receiving a valid hlx-close-view message', async () => {
      mockFetchConfigWithoutPluginsJSONSuccess();
      const addEventListenerStub = sandbox.stub(window, 'addEventListener');

      const sidekick = new AEMSidekick(defaultSidekickConfig);
      document.body.appendChild(sidekick);

      await waitUntil(() => recursiveQuery(sidekick, 'action-bar-picker'));

      appStore.sidekick = sidekick;
      appStore.getViewOverlay(true); // Create a new view

      const sibling = document.createElement('div');
      sibling.style.display = 'none';
      instance.sidekick.parentElement.appendChild(sibling);

      // Simulate receiving a valid message
      const messageEvent = new MessageEvent('message', {
        data: { detail: { event: 'hlx-close-view' } },
        origin: `chrome-extension://${chrome.runtime.id}`,
      });

      // Trigger the event listener manually
      const eventListenerCallback = addEventListenerStub.getCalls().find((call) => call.calledWith('message')).args[1];
      // @ts-ignore
      eventListenerCallback(messageEvent);

      await aTimeout(1000);
      expect(instance.sidekick.shadowRoot.querySelector('.hlx-sk-special-view')).to.be.null;
      expect(sibling.style.display).to.equal('initial');
    }).timeout(5000);
  });

  describe('showView', () => {
    let instance;
    let isProjectStub;
    let findViewsSpy;
    let findViewsStub;
    let getViewOverlayStub;

    beforeEach(async () => {
      instance = appStore;
      isProjectStub = sinon.stub(instance, 'isProject');
      getViewOverlayStub = sinon.stub(instance, 'getViewOverlay');
    });

    afterEach(() => {
      sinon.restore();
      fetchMock.restore();
    });

    it('does nothing if isProject returns false', async () => {
      isProjectStub.returns(false);
      findViewsSpy = sinon.spy(instance, 'findViews');

      await instance.showView();
      expect(isProjectStub.calledOnce).to.be.true;
      expect(findViewsSpy.called).to.be.false;
    });

    it('exits early if "path" search param is present', async () => {
      mockFetchConfigWithoutPluginsJSONSuccess();
      fetchMock.get('https://admin.hlx.page/status/adobe/aem-boilerplate/main/path/placeholders.json?editUrl=auto', {
        status: 200,
        body: {
          body: { },
        },
      }, { overwriteRoutes: true });
      findViewsSpy = sinon.spy(instance, 'findViews');
      instance.location = new URL('https://main--aem-boilerplate--adobe.hlx.page/placeholders.json?path=/path/placeholders.json');
      isProjectStub.returns(true);

      const sidekick = new AEMSidekick(defaultSidekickConfig);
      document.body.appendChild(sidekick);

      await waitUntil(() => recursiveQuery(sidekick, 'plugin-action-bar'));

      await instance.showView();
      expect(findViewsSpy.called).to.be.false;
    });

    it('sets iframe src correctly if a DEFAULT view is found and no overlay exists', async () => {
      mockFetchConfigWithoutPluginsJSONSuccess();
      isProjectStub.returns(true);
      instance.location = new URL('https://main--aem-boilerplate--adobe.hlx.page/placeholders.json');
      findViewsStub = sinon.stub(instance, 'findViews').returns([{ viewer: 'http://viewer.com', title: () => 'Test Title' }]);
      getViewOverlayStub.onCall(0).returns(undefined);

      const sidekick = new AEMSidekick(defaultSidekickConfig);
      instance.sidekick = sidekick;
      document.body.appendChild(sidekick);

      await waitUntil(() => recursiveQuery(sidekick, 'plugin-action-bar'));

      const overlayContainer = document.createElement('div');
      overlayContainer.className = 'hlx-sk-special-view';

      const frame = document.createElement('iframe');
      frame.className = 'container';
      overlayContainer.appendChild(frame);

      getViewOverlayStub.onCall(1).returns(overlayContainer);
      sidekick.shadowRoot.appendChild(overlayContainer);

      await instance.showView();

      expect(frame.src).to.equal('http://viewer.com/?url=https%3A%2F%2Fmain--aem-boilerplate--adobe.hlx.page%2Fplaceholders.json&title=Test+Title');
      expect(findViewsStub.calledWith(VIEWS.DEFAULT)).to.be.true;
      expect(getViewOverlayStub.calledTwice).to.be.true;
    });
  });

  describe('getProfile', () => {
    beforeEach(async () => {
      await appStore.loadContext(sidekickElement, defaultSidekickConfig);
    });

    it('should return the profile on a successful response', async () => {
      mockFetchProfileSuccess();

      const result = await appStore.getProfile();
      expect(result).to.deep.equal(defaultSharepointProfileResponse.profile);
    });

    it('should return false if the response is not ok', async () => {
      mockFetchProfileUnauthorized();

      const result = await appStore.getProfile();
      expect(result).to.be.false;
    });

    it('should handle fetch errors gracefully', async () => {
      mockFetchProfileError();

      const result = await appStore.getProfile();
      expect(result).to.be.false;
    });

    it('should handle fetch throws gracefully', async () => {
      const fetchStub = sinon.stub(window, 'fetch').throws(new Error('Network failure'));

      const result = await appStore.getProfile();
      expect(result).to.be.false;

      fetchStub.restore();
    });
  });

  describe('login', () => {
    let instance;
    let clock;
    let getProfileStub;
    let sandbox;

    beforeEach(() => {
      instance = appStore;
      sandbox = sinon.createSandbox();
      clock = sandbox.useFakeTimers();
      window.hlx = {};
      window.hlx.sidekickConfig = {};

      sandbox.stub(appStore, 'openPage').returns({ closed: true });
      getProfileStub = sandbox.stub(appStore, 'getProfile').resolves(false);
    });

    afterEach(() => {
      clock.restore();
      sandbox.restore();
    });

    it('should attempt to check login status up to 5 times after login window is closed', async () => {
      const modalSpy = sinon.spy(appStore, 'showModal');

      instance.login(false);

      // Fast-forward time to simulate the retries
      for (let i = 0; i < 5; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await clock.tickAsync(1000); // Fast-forward 1 second for each attempt
      }

      expect(getProfileStub.callCount).to.equal(5);

      await waitUntil(() => modalSpy.called, 'Modal never opened');

      expect(modalSpy.callCount).to.equal(2);
      expect(modalSpy.args[1][0].type).to.equal(MODALS.ERROR);
    }).timeout(20000);

    it('handles successful login correctly', async () => {
      instance.sidekick = document.createElement('div');
      getProfileStub.onCall(0).resolves(false);
      getProfileStub.onCall(4).resolves({ name: 'foo' }); // Simulate success on the 5th attempt

      const loginEventSpy = sinon.spy();
      instance.sidekick.addEventListener('loggedin', loginEventSpy);

      // Mock other methods called upon successful login
      const initStoreStub = sandbox.stub(instance.siteStore, 'initStore').resolves();
      const setupCorePluginsStub = sandbox.stub(instance, 'setupCorePlugins');
      const fetchStatusStub = sandbox.stub(instance, 'fetchStatus');
      const hideWaitStub = sandbox.stub(instance, 'hideWait');

      instance.login(false); // Call without selectAccount

      await clock.tickAsync(5000); // Fast-forward time

      expect(initStoreStub.called).to.be.true;
      expect(setupCorePluginsStub.called).to.be.true;
      expect(fetchStatusStub.called).to.be.true;
      expect(hideWaitStub.calledOnce).to.be.true;
    }).timeout(20000);
  });

  describe('logout', () => {
    let instance;
    let clock;
    let getProfileStub;
    let sandbox;

    beforeEach(() => {
      instance = appStore;
      sandbox = sinon.createSandbox();
      clock = sandbox.useFakeTimers();
      window.hlx = {};
      window.hlx.sidekickConfig = {};
      sandbox.stub(appStore, 'openPage').returns({ closed: true });
    });

    afterEach(() => {
      clock.restore();
      sandbox.restore();
    });

    it('should attempt to check logout status up to 5 times after login window is closed', async () => {
      const modalSpy = sinon.spy(appStore, 'showModal');
      getProfileStub = sandbox.stub(appStore, 'getProfile');
      getProfileStub.resolves({ name: 'foo' });

      instance.logout();

      // Fast-forward time to simulate the retries
      await clock.tickAsync(5000);

      expect(getProfileStub.callCount).to.equal(5);

      await waitUntil(() => modalSpy.called, 'Modal never opened');

      expect(modalSpy.callCount).to.equal(2);
      expect(modalSpy.args[1][0].type).to.equal(MODALS.ERROR);
    }).timeout(20000);

    it('handles successful logout correctly', async () => {
      mockFetchStatusSuccess();
      await appStore.loadContext(sidekickElement, defaultSidekickConfig);

      instance.sidekick = document.createElement('div');
      getProfileStub = sandbox.stub(appStore, 'getProfile');
      getProfileStub.onCall(0).resolves({ name: 'foo' });
      getProfileStub.onCall(4).resolves(false); // Simulate success on the 5th attempt

      const loginEventSpy = sinon.spy();
      instance.sidekick.addEventListener('loggedout', loginEventSpy);

      const statusEventSpy = sinon.spy();
      instance.sidekick.addEventListener('statusfetched', statusEventSpy);

      // Mock other methods called upon successful login
      const setupCorePluginsStub = sandbox.stub(instance, 'setupCorePlugins');

      instance.logout();

      // Fast-forward time to simulate the retries
      for (let i = 0; i < 5; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await clock.tickAsync(1000);
      }

      expect(setupCorePluginsStub.calledOnce).to.be.true;
      expect(loginEventSpy.calledOnce).to.be.true;

      await waitUntil(() => statusEventSpy.calledTwice, 'Status should fire twice');
      expect(statusEventSpy.calledTwice).to.be.true;
    }).timeout(20000);
  });

  describe('validateSession tests', () => {
    let instance;
    let clock;
    let now;

    beforeEach(() => {
      instance = appStore;
      now = Date.now();
      clock = sinon.useFakeTimers(now);
      instance.login = sinon.spy();
      instance.showWait = sinon.spy();
      instance.sidekick = { addEventListener: sinon.stub() };
    });

    afterEach(() => {
      clock.restore();
    });

    it('should resolve immediately if profile is not set', async () => {
      instance.status = {};
      await instance.validateSession();
      expect(instance.login.called).to.be.false;
    });

    it('should re-login and show wait if token is expired', async () => {
      const futureTime = now + 1000; // Ensure the token is considered expired
      instance.status = { profile: { exp: futureTime } };
      instance.sidekick.addEventListener.callsFake((event, callback) => callback());

      await instance.validateSession();
      expect(instance.login.calledOnceWith(true)).to.be.true;
      expect(instance.showWait.calledOnce).to.be.true;
    });

    it('should resolve immediately if token is not expired', async () => {
      const pastTime = now - 1000; // Ensure the token is not considered expired
      instance.status = { profile: { exp: pastTime } };
      await instance.validateSession();
      expect(instance.login.called).to.be.false;
    });
  });
});
