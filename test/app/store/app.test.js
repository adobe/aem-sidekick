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
import { defaultSidekickConfig } from '../../fixtures/sidekick-config.js';
import { STATE } from '../../../src/extension/app/constants.js';
import {
  HelixMockContentSources,
  HelixMockContentType,
  HelixMockEnvironments,
  getDefaultEditorEnviromentLocations,
  restoreEnvironment,
} from '../../mocks/environment.js';
import { createAdminUrl } from '../../../src/extension/utils/admin.js';
import { recursiveQuery, error } from '../../test-utils.js';
import { AEMSidekick } from '../../../src/extension/index.js';
import { defaultSharepointProfileResponse, defaultSharepointStatusResponse } from '../../fixtures/helix-admin.js';
import { SidekickTest } from '../../sidekick-test.js';
import { fetchLanguageDict } from '../../../src/extension/app/utils/i18n.js';

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
  /**
   * @type {SidekickTest}
   */
  let sidekickTest;

  /**
   * @type {AEMSidekick}
   */
  let sidekickElement;

  /**
   * @type {AppStore}
   */
  let appStore;

  beforeEach(() => {
    appStore = new AppStore();
    sidekickTest = new SidekickTest(defaultSidekickConfig, appStore);
    sidekickTest
      .mockFetchStatusSuccess()
      .mockFetchSidekickConfigNotFound();

    // @ts-ignore
    sidekickElement = document.createElement('div');
  });

  afterEach(() => {
    sidekickTest.destroy();
  });

  async function testDefaultConfig() {
    expect(appStore.languageDict.add).to.equal('Add');
    expect(appStore.location.hostname).to.equal('localhost');
    expect(appStore.languageDict.title).to.equal('AEM Sidekick');

    await waitUntil(() => appStore.status.webPath, 'Status never loaded');
    expect(appStore.status.webPath).to.equal('/');
    expect(appStore.status.edit.status).to.equal(200);
    expect(appStore.status.live.status).to.equal(200);
  }

  it('loadContext - no config.json', async () => {
    await appStore.loadContext(sidekickElement, defaultSidekickConfig);
    await testDefaultConfig();
  });

  it('loadContext - with config.json and custom plugins', async () => {
    sidekickTest
      .mockFetchSidekickConfigSuccess(true, true);

    await appStore.loadContext(sidekickElement, defaultSidekickConfig);
    await testDefaultConfig();

    expect(appStore.siteStore.plugins.length).to.eq(9);
    expect(appStore.siteStore.scriptUrl).to.eq('https://www.hlx.live/tools/sidekick/index.js');
    expect(appStore.siteStore.host).to.eq('www.aemboilerplate.com');
    expect(appStore.siteStore.innerHost).to.eq('custom-preview-host.com');
    expect(appStore.siteStore.liveHost).to.eq('custom-live-host.com');
    expect(appStore.siteStore.project).to.eq('AEM Boilerplate');
  });

  it('loadContext - unsupported lang, default to en', async () => {
    sidekickTest
      .mockFetchSidekickConfigSuccess(true, true);

    const config = {
      ...defaultSidekickConfig,
      lang: 'abc',
    };

    await appStore.loadContext(sidekickElement, config);
    await testDefaultConfig();

    expect(appStore.languageDict.title).to.eq('AEM Sidekick');
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

    appStore.location.host = 'adobe.sharepoint.com';
    appStore.location.pathname = '/:w:/r/foo/_layouts/15/Doc.aspx';
    appStore.location.search = '?sourcedoc=AABBCC&file=about.docx&action=default&mobileredirect=true';
    expect(appStore.isEditor()).to.be.true;

    appStore.location.host = 'adobe.sharepoint.com';
    appStore.location.pathname = '/:w:/r/foo/_layouts/15/stream.aspx';
    appStore.location.search = '?id=/foo/video.mp4&referrer=StreamWebApp&view=ebe25cbf-40ca-4fe7-b345-2de37449b94e';
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
      sidekickTest.mockFetchStatusSuccess(true);
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
    let instance;

    beforeEach(() => {
      instance = appStore;
    });

    afterEach(() => {
      sidekickTest.sandbox.restore();
    });

    it('success', async () => {
      sidekickTest
        .mockFetchStatusSuccess();
      await instance.loadContext(sidekickElement, defaultSidekickConfig);
      await instance.fetchStatus(true);
      await waitUntil(
        () => instance.status.webPath,
        'Status never loaded',
      );
      expect(instance.status.webPath).to.equal('/');
    });

    it('success - editor', async () => {
      sidekickTest
        .mockFetchEditorStatusSuccess(HelixMockContentSources.GDRIVE);

      sidekickTest.sandbox.stub(instance, 'isEditor').returns(true);
      await instance.loadContext(sidekickElement, defaultSidekickConfig);
      await instance.fetchStatus();
      await waitUntil(
        () => appStore.status.webPath,
        'Status never loaded',
      );
      expect(appStore.status.webPath).to.equal('/');
    });

    it('unauthorized', async () => {
      sidekickTest
        .mockFetchStatusUnauthorized();
      await instance.loadContext(sidekickElement, defaultSidekickConfig);
      await waitUntil(
        () => instance.status.status,
        'Status never loaded',
      );
      expect(instance.status.status).to.equal(401);
    });

    it('server error', async () => {
      sidekickTest
        .mockFetchStatusError();
      await instance.loadContext(sidekickElement, defaultSidekickConfig);
      await waitUntil(
        () => instance.status.status,
        'Status never loaded',
      );
      expect(instance.status.status).to.equal(500);
    });

    it('status returns 429', async () => {
      sidekickTest
        .mockFetchStatus429();
      await instance.loadContext(sidekickElement, defaultSidekickConfig);
      await waitUntil(
        () => instance.status.status,
        'Status never loaded',
      );

      expect(instance.status.status).to.equal(429);
    });

    it('empty config returns no status', async () => {
      sidekickTest
        .mockFetchStatusError();
      const fetchStatusSpy = sidekickTest.sandbox.spy(instance, 'fetchStatus');
      // @ts-ignore
      await appStore.loadContext(sidekickElement, {});
      expect(await fetchStatusSpy.returnValues[0]).to.be.undefined;
    });
  });

  describe('show toast', async () => {
    beforeEach(() => {
      // @ts-ignore
      appStore.sidekick = document.createElement('div');
      appStore.sidekick.attachShadow({ mode: 'open' });
      appStore.sidekick.shadowRoot.appendChild(document.createElement('theme-wrapper'));
    });

    it('shows a toast with a primary action', async () => {
      const closeCallback = () => {};
      const actionCallback = () => {};
      const toastSpy = sidekickTest.sandbox.spy(appStore, 'showToast');
      appStore.showToast({
        message: 'test',
        variant: 'info',
        actionCallback,
        closeCallback,
      });
      expect(appStore.toast).to.deep.equal({
        closeCallback,
        actionCallback,
        actionLabel: appStore.i18n('ok'),
        message: 'test',
        timeout: 3000,
        variant: 'info',
        secondaryCallback: undefined,
        secondaryLabel: undefined,
        timeoutCallback: undefined,
      });
      expect(appStore.state).to.equal(STATE.TOAST);
      expect(toastSpy.calledOnce).to.be.true;
    });

    it('closes toast after timeout and calls timeout callback', async () => {
      const closeToastSpy = sidekickTest.sandbox.spy(appStore, 'closeToast');
      const timeoutCallback = sidekickTest.sandbox.spy();
      appStore.showToast({
        message: 'test',
        variant: 'info',
        timeout: 1000,
        timeoutCallback,
      });

      await waitUntil(() => timeoutCallback.calledOnce, 'timeout callback never called', { timeout: 2000 });
      expect(closeToastSpy.calledOnce).to.be.true;
    });

    it('closes toast on close button click and calls close callback', async () => {
      const closeCallback = sidekickTest.sandbox.spy();
      appStore.showToast({
        message: 'test',
        variant: 'info',
        timeout: 0,
        closeCallback,
      });

      appStore.closeToast();

      expect(closeCallback.calledOnce).to.be.true;
    });
  });

  describe('reloadPage', async () => {
    let openPageStub;
    let loadPageStub;
    let instance;

    beforeEach(() => {
      instance = appStore;
      openPageStub = sidekickTest.sandbox.stub(instance, 'openPage');
      loadPageStub = sidekickTest.sandbox.stub(instance, 'loadPage');
    });

    afterEach(() => {
      sidekickTest.sandbox.restore();
    });

    it('opens a new tab', () => {
      instance.reloadPage(true);
      expect(openPageStub.calledOnce).to.be.true;
    });

    it('reloads the current tab', () => {
      instance.reloadPage();
      expect(loadPageStub.calledOnce).to.be.true;
    });
  });

  describe('switchEnv', async () => {
    const mockStatus = defaultSharepointStatusResponse;
    let openPage;
    let loadPage;
    let instance;

    beforeEach(() => {
      sidekickTest.sandbox.stub(window, 'fetch').resolves(new Response(JSON.stringify({
        webPath: '/somepath',
        edit: { url: 'https://my.sharepoint.com/:w:/r/personal/directory/_layouts/15/Doc.aspx?sourcedoc=ABC&file=about.docx' },
      })));
      instance = appStore;
      // @ts-ignore
      instance.siteStore = {
        owner: 'adobe',
        repo: 'aem-boilerplate',
        ref: 'main',
        innerHost: new URL(mockStatus.preview.url).hostname,
        outerHost: new URL(mockStatus.live.url).hostname,
        devUrl: new URL('https://localhost:3000'),
        views: [{
          path: '**.json',
          viewer: '/test/fixtures/views/json/json.html',
        }],
      };

      // Mock other functions
      sidekickTest.sandbox.stub(instance, 'fireEvent');

      openPage = sidekickTest.sandbox.spy();
      loadPage = sidekickTest.sandbox.spy();
      sidekickTest.sandbox.stub(instance, 'openPage').callsFake(openPage);
      sidekickTest.sandbox.stub(instance, 'loadPage').callsFake(loadPage);
    });

    afterEach(() => {
      sidekickTest.destroy();
    });

    it('switches from editor to preview', async () => {
      instance.location = new URL(getDefaultEditorEnviromentLocations(
        HelixMockContentSources.SHAREPOINT,
        HelixMockContentType.DOC),
      );
      instance.status = mockStatus;
      await instance.switchEnv('preview');
      expect(openPage.calledWith(mockStatus.preview.url)).to.be.true;
    });

    it('switches from editor to preview w/cache busting', async () => {
      instance.location = new URL(getDefaultEditorEnviromentLocations(
        HelixMockContentSources.SHAREPOINT,
        HelixMockContentType.DOC),
      );
      instance.status = mockStatus;
      await instance.switchEnv('preview', false, true);
      const openPageArgs = openPage.args[0];
      expect(openPageArgs[0]).to.include('nocache');
    });

    it('switches from preview to editor', async () => {
      const fetchStatusSpy = sidekickTest.sandbox.spy(instance, 'fetchStatus');
      instance.location = new URL(mockStatus.preview.url);
      instance.status = mockStatus;
      await instance.switchEnv('edit', true);
      expect(openPage.calledWith('https://my.sharepoint.com/:w:/r/personal/directory/_layouts/15/Doc.aspx?sourcedoc=ABC&file=about.docx')).to.be.true;
      expect(fetchStatusSpy.calledWith(false, true)).to.be.true;
    });

    it('switches from preview to production host', async () => {
      const prodHost = 'aem-boilerplate.com';
      instance.siteStore.host = prodHost;

      instance.location = new URL(mockStatus.preview.url);
      instance.status = mockStatus;
      await instance.switchEnv('prod', true, true);
      const openPageArgs = openPage.args[0];
      expect(openPageArgs[0]).to.include(prodHost);
      expect(openPageArgs[0]).to.include('nocache');
    });

    it('switches from preview to production host, maintains url params', async () => {
      const prodHost = 'aem-boilerplate.com';
      instance.siteStore.host = prodHost;

      instance.location = new URL(`${mockStatus.preview.url}?foo=bar`);
      instance.status = mockStatus;
      await instance.switchEnv('prod', true, true);
      const openPageArgs = openPage.args[0];
      expect(openPageArgs[0]).to.include(prodHost);
      expect(openPageArgs[0]).to.include('nocache');
      expect(openPageArgs[0]).to.include('foo=bar');
    });

    it('switches from preview to BYOM editor', async () => {
      instance.siteStore.contentSourceUrl = 'https://aemcloud.com';
      instance.siteStore.contentSourceEditLabel = 'Universal Editor';
      instance.siteStore.contentSourceEditPattern = '{{contentSourceUrl}}{{pathname}}?cmd=open';

      const fetchStatusStub = sidekickTest.sandbox.stub(instance, 'fetchStatus');
      fetchStatusStub.resolves({});

      instance.location = new URL(mockStatus.preview.url);
      instance.status = mockStatus;
      await instance.switchEnv('edit');
      expect(loadPage.calledWith('https://aemcloud.com/index?cmd=open')).to.be.true;
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

    it('switches from preview to live w/cache busting', async () => {
      instance.location = new URL(mockStatus.preview.url);
      instance.status = mockStatus;
      await instance.switchEnv('live', true, true);
      const openPageArgs = openPage.args[0];
      expect(openPageArgs[0]).to.include('nocache');
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

    it('displays warning when switching to edit without source document', async () => {
      instance.location = new URL(mockStatus.preview.url);
      instance.status = mockStatus;
      sidekickTest.sandbox.stub(instance, 'fetchStatus').resolves({
        ...mockStatus,
        edit: { status: 404 },
      });
      const showToastStub = sidekickTest.sandbox.stub(instance, 'showToast');

      await instance.switchEnv('edit');

      await waitUntil(() => showToastStub.calledOnce);
      expect(openPage.calledOnce).to.be.false;
      expect(showToastStub.calledWithMatch({
        variant: 'warning',
      })).to.be.true;
    });

    it('retries if status not ready yet', async () => {
      const consoleSpy = sidekickTest.sandbox.spy(console, 'log');
      instance.location = new URL(mockStatus.preview.url);
      instance.status = {};
      await instance.switchEnv('live');
      expect(consoleSpy.calledWith('not ready yet, trying again in a second ...')).to.be.true;
    });
  });

  describe('update', async () => {
    let fakeFetch;
    let instance;
    let setStateStub;

    beforeEach(() => {
      const { sandbox } = sidekickTest;
      fakeFetch = sandbox.stub(window, 'fetch');
      instance = appStore;
      setStateStub = sandbox.stub(instance, 'setState');

      // Mock other functions
      sandbox.stub(instance, 'isContent');
      sandbox.stub(instance, 'isEditor');
      sandbox.stub(instance, 'isPreview');
      sandbox.stub(instance, 'fireEvent');
    });

    afterEach(() => {
      sidekickTest.sandbox.restore();
    });

    it('should handle successful update', async () => {
      sidekickTest.sandbox.stub(instance, 'isDev').returns(false);
      instance.isContent.returns(true);
      instance.status = { webPath: '/somepath' };

      fakeFetch.resolves({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: () => Promise.resolve({ webPath: '/somepath' }),
      });

      const response = await instance.update();

      expect(response).to.be.true;
      expect(setStateStub.calledWith(STATE.PREVIEWING)).to.be.true;
    });

    it('should detect config path', async () => {
      sidekickTest.sandbox.stub(instance, 'isDev').returns(false);
      instance.isContent.returns(true);
      instance.status = { webPath: '/.helix/config' };

      fakeFetch.resolves({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: () => Promise.resolve({ webPath: '/.helix/config' }),
      });

      const response = await instance.update();

      expect(response).to.be.true;
      expect(setStateStub.calledWith(STATE.CONFIG)).to.be.true;
    });

    it('should bust client cache', async () => {
      sidekickTest.sandbox.stub(instance, 'isDev').returns(false);
      instance.isPreview.returns(true);
      instance.status = { webPath: '/somepath' };
      instance.siteStore.innerHost = 'main--aem-boilerplate--adobe.hlx.page';

      fakeFetch.resolves({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: () => Promise.resolve({ webPath: '/somepath' }),
      });

      const response = await instance.update();

      expect(response).to.be.true;
      expect(fakeFetch.args[1][0]).to.equal('https://main--aem-boilerplate--adobe.hlx.page/somepath');
      expect(fakeFetch.args[1][1]).to.deep.equal({ cache: 'reload', mode: 'no-cors' });
    });

    it('should bust client cache (localhost)', async () => {
      sidekickTest.sandbox.stub(instance, 'isDev').returns(true);
      instance.isPreview.returns(true);
      instance.siteStore.devUrl = new URL('http://localhost:3000');
      instance.location = new URL('http://localhost:3000/somepath');
      instance.siteStore.innerHost = 'main--aem-boilerplate--adobe.hlx.page';
      instance.status = { webPath: '/somepath' };

      fakeFetch.resolves({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: () => Promise.resolve({ webPath: '/somepath' }),
      });

      const response = await instance.update();

      expect(response).to.be.true;
      expect(fakeFetch.args[1][0]).to.equal('localhost:3000/somepath');
      expect(fakeFetch.args[1][1]).to.deep.equal({ cache: 'reload', mode: 'no-cors' });
    });

    it('should handle fetch error', async () => {
      fakeFetch.rejects(new Error('Network failure'));

      const response = await instance.update('/testpath');

      expect(response).to.be.false;
    });

    it('should handle non-OK response from fetch', async () => {
      fakeFetch.resolves({ ok: false, status: 404, headers: { get: () => 'Not Found' } });

      const response = await instance.update('/testpath');

      expect(response).to.be.false;
    });
  });

  describe('updatePreview', () => {
    let instance;
    let sandbox;
    let updateStub;
    let fetchStatusStub;
    let showToastStub;
    let updatePreviewSpy;

    beforeEach(async () => {
      instance = appStore;
      sandbox = sinon.createSandbox();
      // @ts-ignore
      instance.sidekick = document.createElement('div');
      instance.languageDict = await fetchLanguageDict(undefined, 'en');
      updateStub = sandbox.stub(instance, 'update');
      fetchStatusStub = sandbox.stub(instance, 'fetchStatus');
      showToastStub = sandbox.stub(instance, 'showToast');
      updatePreviewSpy = sandbox.spy(instance, 'updatePreview');
    });

    afterEach(() => {
      sandbox.restore();
    });

    it('should show previewing, update, and handle success response', async () => {
      updateStub.resolves({ ok: true });
      instance.status = { webPath: '/somepath' };

      await instance.updatePreview(false);

      expect(showToastStub.calledOnce).is.true;
    });

    it('should show previewing, update, and handle success response with toast action', async () => {
      updateStub.resolves({ ok: true });
      instance.status = { webPath: '/somepath' };

      const switchEnvSpy = sandbox.spy(instance, 'switchEnv');

      await instance.updatePreview(false);

      expect(showToastStub.calledOnce).is.true;
      expect(updateStub.calledOnce).is.true;

      expect(switchEnvSpy.calledWith('preview'));
    });

    // Test when resp is not ok, ranBefore is false
    it('should handle failure response without ranBefore', async () => {
      updateStub.resolves(false);
      instance.status = { webPath: '/somepath' };

      await instance.updatePreview(false);

      expect(updateStub.calledOnce).is.true;
      expect(fetchStatusStub.called).is.true;

      instance.sidekick.dispatchEvent(new CustomEvent('status-fetched', { detail: { status: { webPath: '/somepath' } } }));
      await waitUntil(() => updatePreviewSpy.calledTwice);
    });

    // Test when resp is ok and status.webPath does not start with /.helix/
    it('should handle generic success', async () => {
      updateStub.resolves(true);
      instance.status = { webPath: '/not-helix/' };

      await instance.updatePreview(false);

      expect(showToastStub.calledOnce).is.true;
      expect(showToastStub.calledWith({
        message: 'Preview successfully updated, opening Preview...',
        variant: 'positive',
      })).is.true;
    });

    // Test when resp is ok and status.webPath starts with /.helix/
    it('should handle config success', async () => {
      updateStub.resolves(true);
      instance.status = { webPath: '/.helix/foo' };

      await instance.updatePreview(false);

      expect(showToastStub.calledOnce).is.true;
      expect(showToastStub.calledWith({
        message: 'Configuration successfully activated.',
        variant: 'positive',
      })).is.true;
    });
  });

  describe('delete', async () => {
    const deletePath = '/delete-path';

    let sandbox;
    let fakeFetch;
    let instance;

    beforeEach(() => {
      sandbox = sidekickTest.sandbox;
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
      expect(resp).to.be.true;
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

      expect(resp).to.be.true;
      expect(unpublishStub.calledOnce).to.be.true;
    });

    it('only deletes content', async () => {
      instance.isContent.returns(false);
      instance.status = {
        webPath: deletePath,
      };

      const resp = await instance.delete();

      expect(resp).to.equal(false);
      expect(fakeFetch.called).to.be.false;
    });

    it('handles network error', async () => {
      instance.isContent.returns(true);
      instance.status = { webPath: deletePath };

      fakeFetch.throws(error);

      const response = await instance.delete();

      expect(response).to.equal(false);
    });
  });

  describe('publish', () => {
    let instance;
    let fetchStub;

    beforeEach(() => {
      instance = appStore;
      fetchStub = sidekickTest.sandbox.stub(window, 'fetch')
        // @ts-ignore
        .resolves({
          ok: true,
          status: 200,
          headers: new Headers(),
          json: () => Promise.resolve({}),
        });
    });

    afterEach(() => {
      restoreEnvironment(document);
    });

    it('only publishes content', async () => {
      sidekickTest.sandbox.stub(instance, 'isContent').returns(false);
      instance.status = { webPath: '/somepath' };

      const result = await instance.publish();

      expect(result).to.equal(false);
    });

    it('should handle successful publish', async () => {
      sidekickTest.mockHelixEnvironment(HelixMockEnvironments.PREVIEW);
      sidekickTest.sandbox.stub(instance, 'isContent').returns(true);
      instance.status = { webPath: '/somepath' };
      instance.siteStore = {
        innerHost: 'main--aem-boilerplate--adobe.hlx.page',
        outerHost: 'main--aem-boilerplate--adobe.hlx.live',
        host: 'host',
      };
      instance.location = {
        href: 'https://aem-boilerplate.com',
        host: 'aem-boilerplate.com',
      };

      const resp = await instance.publish();

      expect(fetchStub.called).is.true;
      expect(resp).to.equal(true);
    });

    it('should handle fetch errors', async () => {
      sidekickTest.sandbox.stub(instance, 'isContent').returns(true);
      fetchStub.rejects(new Error());
      instance.status = { webPath: '/somepath' };
      instance.siteStore = { owner: 'adobe', repo: 'aem-boilerplate' };
      instance.location = { href: 'https://aem-boilerplate.com', host: 'aem-boilerplate.com' };

      const resp = await instance.publish();

      expect(fetchStub.called).is.true;
      expect(resp).to.equal(false);
    });

    it('should handle publish when outerHost is defined', async () => {
      sidekickTest.sandbox.stub(instance, 'isContent').returns(true);
      instance.status = { webPath: '/somepath' };
      instance.siteStore = { innerHost: 'main--aem-boilerplate--adobe.hlx.page', outerHost: 'main--aem-boilerplate--adobe.hlx.live' };
      instance.location = { href: 'https://aem-boilerplate.com', host: 'aem-boilerplate.com' };

      await instance.publish();
    });

    it('should purge host', async () => {
      sidekickTest.sandbox.stub(instance, 'isContent').returns(true);
      sidekickTest.sandbox.stub(instance, 'isEditor').returns(true);
      instance.status = { webPath: '/somepath' };
      instance.siteStore = { innerHost: 'main--aem-boilerplate--adobe.hlx.page', host: 'aem-boilerplate.com' };
      instance.location = { href: 'https://aem-boilerplate.com', host: 'aem-boilerplate.com' };

      await instance.publish();
    });

    it('should handle publish when host is defined', async () => {
      sidekickTest.sandbox.stub(instance, 'isContent').returns(true);
      instance.status = { webPath: '/somepath' };
      instance.siteStore = { innerHost: 'main--aem-boilerplate--adobe.hlx.page', host: 'aem-boilerplate.com' };
      instance.location = { href: 'https://aem-boilerplate.com', host: 'aem-boilerplate.com' };

      await instance.publish();
    });

    it('should use correct parameters for fetch call', async () => {
      sidekickTest.sandbox.stub(instance, 'isContent').returns(true);
      instance.status = { webPath: '/somepath' };
      instance.siteStore = { innerHost: 'main--aem-boilerplate--adobe.hlx.page' };
      instance.location = { href: 'https://aem-boilerplate.com', host: 'aem-boilerplate.com' };
      const expectedUrl = createAdminUrl(instance.siteStore, 'live', '/somepath');

      await instance.publish();

      expect(fetchStub.calledWithMatch(expectedUrl)).is.true;
    });

    it('should properly set error from response headers', async () => {
      sidekickTest.sandbox.stub(instance, 'isContent').returns(true);
      instance.status = { webPath: '/somepath' };
      instance.siteStore = { owner: 'adobe', repo: 'aem-boilerplate' };
      instance.location = { href: 'https://aem-boilerplate.com', host: 'aem-boilerplate.com' };

      const headers = new Headers();
      headers.append('x-error', 'Some error');
      const mockResponse = {
        status: 502,
        ok: false,
        headers,
      };
      fetchStub.resolves(mockResponse);

      const resp = await instance.publish();

      expect(resp).to.be.false;
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

      expect(resp).to.be.true;
    });

    it('only unpublishes content', async () => {
      instance.isContent.returns(false);
      instance.status = {
        webPath: unpublishPath,
      };

      const resp = await instance.unpublish();

      expect(resp).to.be.false;
      expect(fakeFetch.called).to.be.false;
    });

    it('handles network error', async () => {
      instance.isContent.returns(true);
      instance.status = { webPath: unpublishPath };

      fakeFetch.throws(error);

      const resp = await instance.unpublish();

      expect(resp).to.be.false;
    });
  });

  describe('findViews', () => {
    let instance;

    beforeEach(() => {
      instance = appStore;
      instance.status = { webPath: '/some.json' };
      // @ts-ignore
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
      existingView.classList.add('aem-sk-special-view');
      sidekickElement.shadowRoot.appendChild(existingView);

      const view = instance.getViewOverlay(false);
      expect(view).to.equal(existingView);
    });

    it('creates and returns a new view when none exists and create is true', async () => {
      await appStore.loadContext(sidekickElement, defaultSidekickConfig);
      const view = instance.getViewOverlay(true);
      expect(view.classList.contains('aem-sk-special-view')).to.be.true;
      expect(instance.sidekick.shadowRoot.querySelector('.aem-sk-special-view')).to.equal(view);
    });

    it('adds an iframe to the new view with the correct attributes', async () => {
      await appStore.loadContext(sidekickElement, defaultSidekickConfig);
      const view = instance.getViewOverlay(true);
      const iframe = view.querySelector('iframe.container');
      expect(iframe).to.not.be.null;
      expect(iframe.getAttribute('allow')).to.equal('clipboard-write *');
    });

    it('removes the view and resets siblings display on receiving a valid hlx-close-view message', async () => {
      sidekickTest
        .mockFetchSidekickConfigSuccess(true, false);

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
      expect(instance.sidekick.shadowRoot.querySelector('.aem-sk-special-view')).to.be.null;
      expect(sibling.style.display).to.equal('initial');
    }).timeout(5000);
  });

  describe('showModal', async () => {
    it('displays a modal', async () => {
      // @ts-ignore
      appStore.sidekick = document.createElement('div');
      appStore.sidekick.attachShadow({ mode: 'open' });
      appStore.sidekick.shadowRoot.appendChild(document.createElement('theme-wrapper'));

      document.body.appendChild(appStore.sidekick);

      appStore.showModal({
        type: 'error',
        data: {
          headline: 'Oops',
          message: 'Something went wrong',
          confirmLabel: 'Okie',
        },
      });

      const modal = recursiveQuery(appStore.sidekick, 'modal-container');
      expect(modal).to.exist;

      await waitUntil(() => recursiveQuery(modal, 'h2'));
      expect(recursiveQuery(modal, 'h2').textContent.trim()).to.equal('Oops');
      expect(recursiveQuery(modal, 'sp-dialog-wrapper').textContent.trim()).to.equal('Something went wrong');
      expect(recursiveQuery(modal, 'sp-button').textContent.trim()).to.equal('Okie');
    });

    it('removes old modal before showing new one', async () => {
      // @ts-ignore
      appStore.sidekick = document.createElement('div');
      appStore.sidekick.attachShadow({ mode: 'open' });
      appStore.sidekick.shadowRoot.appendChild(document.createElement('theme-wrapper'));

      document.body.appendChild(appStore.sidekick);

      appStore.showModal({
        type: 'error',
        data: {
          headline: 'Oops',
        },
      });
      appStore.showModal({
        type: 'error',
        data: {
          headline: 'Oops again',
        },
      });

      const modal = recursiveQuery(appStore.sidekick, 'modal-container');
      expect(modal).to.exist;

      await waitUntil(() => recursiveQuery(modal, 'h2'));
      expect(recursiveQuery(modal, 'h2').textContent.trim()).to.equal('Oops again');
    });
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

    const getViewOverlayFrame = (sidekick) => {
      const overlayContainer = document.createElement('div');
      overlayContainer.className = 'aem-sk-special-view';

      const frame = document.createElement('iframe');
      frame.className = 'container';
      overlayContainer.appendChild(frame);

      getViewOverlayStub.onCall(1).returns(overlayContainer);
      sidekick.shadowRoot.appendChild(overlayContainer);

      return frame;
    };

    it('does nothing if isProject returns false', async () => {
      isProjectStub.returns(false);
      findViewsSpy = sinon.spy(instance, 'findViews');

      await instance.showView();
      expect(isProjectStub.calledOnce).to.be.true;
      expect(findViewsSpy.called).to.be.false;
    });

    it('exits early if "path" search param is present', async () => {
      sidekickTest.mockFetchSidekickConfigSuccess(true, false);
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
      sidekickTest.mockFetchSidekickConfigSuccess(true, false);
      isProjectStub.returns(true);
      instance.location = new URL('https://main--aem-boilerplate--adobe.hlx.page/placeholders.json');
      findViewsStub = sinon.stub(instance, 'findViews').returns([{ viewer: 'http://viewer.com', title: () => 'Test Title' }]);
      getViewOverlayStub.onCall(0).returns(undefined);

      const sidekick = new AEMSidekick(defaultSidekickConfig);
      instance.sidekick = sidekick;
      document.body.appendChild(sidekick);

      await waitUntil(() => recursiveQuery(sidekick, 'plugin-action-bar'));

      const frame = getViewOverlayFrame(sidekick);

      await instance.showView();

      expect(frame.src).to.equal('http://viewer.com/?url=https%3A%2F%2Fmain--aem-boilerplate--adobe.hlx.page%2Fplaceholders.json&title=Test+Title');
      expect(findViewsStub.calledWith(VIEWS.DEFAULT)).to.be.true;
      expect(getViewOverlayStub.calledTwice).to.be.true;
    });

    it('loads login view on 401 site response', async () => {
      const i18nSpy = sinon.spy(instance, 'i18n');

      sidekickTest.mockFetchSidekickConfigSuccess(true, false);
      isProjectStub.returns(true);
      instance.location = new URL('https://main--aem-boilerplate--adobe.aem.page/protected');
      getViewOverlayStub.onCall(0).returns(undefined);

      const sidekick = new AEMSidekick(defaultSidekickConfig);
      instance.sidekick = sidekick;
      document.body.innerHTML = '<pre>401 Unauthorized</pre>';
      document.body.prepend(sidekick);

      await waitUntil(() => recursiveQuery(sidekick, 'plugin-action-bar'));

      const frame = getViewOverlayFrame(sidekick);

      await instance.showView();

      const frameUrl = new URL(frame.src);
      expect(frameUrl.pathname.endsWith('/views/login/login.html')).to.be.true;
      expect(frameUrl.searchParams.get('url')).to.equal('https://main--aem-boilerplate--adobe.aem.page/protected');
      expect(i18nSpy.calledWith('site_login_required')).to.be.true;
    });

    it('loads login view on 403 site response', async () => {
      const i18nSpy = sinon.spy(instance, 'i18n');

      sidekickTest.mockFetchSidekickConfigSuccess(true, false);
      isProjectStub.returns(true);
      instance.location = new URL('https://main--aem-boilerplate--adobe.aem.page/protected');
      getViewOverlayStub.onCall(0).returns(undefined);

      const sidekick = new AEMSidekick(defaultSidekickConfig);
      instance.sidekick = sidekick;

      document.body.innerHTML = '<pre>403 Forbidden</pre>';
      document.body.prepend(sidekick);

      await waitUntil(() => recursiveQuery(sidekick, 'plugin-action-bar'));

      const frame = getViewOverlayFrame(sidekick);

      await instance.showView();

      const frameUrl = new URL(frame.src);
      expect(frameUrl.pathname.endsWith('/views/login/login.html')).to.be.true;
      expect(frameUrl.searchParams.get('url')).to.equal('https://main--aem-boilerplate--adobe.aem.page/protected');
      expect(i18nSpy.calledWith('site_forbidden')).to.be.true;
    });
  });

  describe('getProfile', () => {
    beforeEach(async () => {
      await appStore.loadContext(sidekickElement, defaultSidekickConfig);
    });

    it('should return the profile on a successful response', async () => {
      sidekickTest.mockFetchProfileSuccess();

      const result = await appStore.getProfile();
      expect(result).to.deep.equal(defaultSharepointProfileResponse.profile);
    });

    it('should return false if the response is not ok', async () => {
      sidekickTest.mockFetchProfileUnauthorized();

      const result = await appStore.getProfile();
      expect(result).to.be.false;
    });

    it('should handle fetch errors gracefully', async () => {
      sidekickTest.mockFetchProfileError();

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
    let reloadPageStub;
    let sandbox;
    let toastSpy;

    beforeEach(async () => {
      instance = appStore;
      instance.languageDict = await fetchLanguageDict(undefined, 'en');
      const config = {
        ...defaultSidekickConfig,
        host: 'aem-boilerplate.com',
      };

      await instance.loadContext(sidekickElement, config);
      sandbox = sinon.createSandbox();
      clock = sandbox.useFakeTimers();
      window.hlx = {};
      window.hlx.sidekickConfig = {};

      // @ts-ignore
      sandbox.stub(appStore, 'openPage').returns({ closed: true });
      toastSpy = sandbox.spy(appStore, 'showToast');
      getProfileStub = sandbox.stub(appStore, 'getProfile').resolves(false);
      reloadPageStub = sandbox.stub(appStore, 'reloadPage');
    });

    afterEach(() => {
      clock.restore();
      sandbox.restore();
    });

    it('should attempt to check login status up to 5 times after login window is closed', async () => {
      instance.login(false);

      // Fast-forward time to simulate the retries
      for (let i = 0; i < 5; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await clock.tickAsync(1000); // Fast-forward 1 second for each attempt
      }

      expect(getProfileStub.callCount).to.equal(5);

      await waitUntil(() => toastSpy.called, 'Modal never opened');

      expect(toastSpy.calledWith('Sign out failed. Please try again later.', 'negative'));
    }).timeout(20000);

    it('handles successful login correctly', async () => {
      instance.sidekick = document.createElement('div');

      getProfileStub.onCall(0).resolves(false);
      getProfileStub.onCall(4).resolves({ name: 'foo' }); // Simulate success on the 5th attempt

      const loginEventSpy = sinon.spy();
      const rumStub = sinon.stub(instance, 'sampleRUM');
      instance.sidekick.addEventListener('logged-in', loginEventSpy);

      // Mock other methods called upon successful login
      const initStoreStub = sandbox.stub(instance.siteStore, 'initStore').resolves();
      const setupCorePluginsStub = sandbox.stub(instance, 'setupCorePlugins');
      const fetchStatusStub = sandbox.stub(instance, 'fetchStatus');

      instance.login(false); // Call without selectAccount

      await clock.tickAsync(5000); // Fast-forward time

      expect(initStoreStub.called).to.be.true;
      expect(setupCorePluginsStub.called).to.be.true;
      expect(fetchStatusStub.called).to.be.true;
      expect(rumStub.calledWith('click', {
        source: 'sidekick',
        target: 'logged-in',
      })).to.be.true;
    }).timeout(20000);

    it('reloads page after successful login if 401 page', async () => {
      document.body.innerHTML = '<pre>401 Unauthorized</pre>';
      instance.sidekick = document.createElement('div');
      document.body.prepend(instance.sidekick);

      getProfileStub.onCall(0).resolves({ name: 'foo' }); // Simulate success on the 1st attempt

      // Mock other methods called upon successful login
      const initStoreStub = sandbox.stub(instance.siteStore, 'initStore').resolves();
      const setupCorePluginsStub = sandbox.stub(instance, 'setupCorePlugins');
      const fetchStatusStub = sandbox.stub(instance, 'fetchStatus');

      instance.login(false); // Call without selectAccount

      await clock.tickAsync(5000); // Fast-forward time

      expect(initStoreStub.called).to.be.true;
      expect(setupCorePluginsStub.called).to.be.true;
      expect(fetchStatusStub.called).to.be.false;
      expect(reloadPageStub.called).to.be.true;
    });
  });

  describe('logout', () => {
    let instance;
    let clock;
    let getProfileStub;
    let sandbox;
    let toastSpy;

    beforeEach(async () => {
      instance = appStore;
      instance.languageDict = await fetchLanguageDict(undefined, 'en');
      const config = {
        ...defaultSidekickConfig,
        host: 'aem-boilerplate.com',
      };

      await instance.loadContext(sidekickElement, config);
      sandbox = sinon.createSandbox();
      clock = sandbox.useFakeTimers();
      window.hlx = {};
      window.hlx.sidekickConfig = {};
      // @ts-ignore
      sandbox.stub(appStore, 'openPage').returns({ closed: true });
      toastSpy = sandbox.spy(appStore, 'showToast');
    });

    afterEach(() => {
      clock.restore();
      sandbox.restore();
    });

    it('should attempt to check logout status up to 5 times after login window is closed', async () => {
      getProfileStub = sandbox.stub(appStore, 'getProfile');
      getProfileStub.resolves({ name: 'foo' });

      instance.logout();

      // Fast-forward time to simulate the retries
      await clock.tickAsync(5000);

      expect(getProfileStub.callCount).to.equal(5);

      await waitUntil(() => toastSpy.called, 'Modal never opened');

      expect(toastSpy.calledWith('Sign out failed. Please try again later.', 'negative'));
    }).timeout(20000);

    it('handles successful logout correctly', async () => {
      sidekickTest.mockFetchStatusSuccess();
      await appStore.loadContext(sidekickElement, defaultSidekickConfig);

      instance.sidekick = document.createElement('div');
      getProfileStub = sandbox.stub(appStore, 'getProfile');
      getProfileStub.onCall(0).resolves({ name: 'foo' });
      getProfileStub.onCall(4).resolves(false); // Simulate success on the 5th attempt

      const rumStub = sinon.stub(instance, 'sampleRUM');
      const loginEventSpy = sinon.spy();
      instance.sidekick.addEventListener('logged-out', loginEventSpy);

      const statusEventSpy = sinon.spy();
      instance.sidekick.addEventListener('status-fetched', statusEventSpy);

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

      expect(rumStub.calledWith('click', {
        source: 'sidekick',
        target: 'logged-out',
      })).to.be.true;
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
      // @ts-ignore
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

    it('should re-login if token is expired', async () => {
      const futureTime = now - 1000; // Ensure the token is considered expired
      instance.status = { profile: { exp: futureTime / 1000 } };
      instance.sidekick.addEventListener.callsFake((event, callback) => callback());

      await instance.validateSession();
      expect(instance.login.calledOnceWith(true)).to.be.true;
    });

    it('should resolve immediately if token is not expired', async () => {
      const pastTime = now + 10000; // Ensure the token is not considered expired
      instance.status = { profile: { exp: pastTime / 1000 } };
      await instance.validateSession();
      expect(instance.login.called).to.be.false;
    });
  });

  describe('getContentSourceLabel', () => {
    let instance;

    beforeEach(() => {
      instance = new AppStore();
    });

    it('should return "SharePoint" if sourceLocation includes "onedrive:"', () => {
      instance.siteStore.contentSourceType = 'onedrive';
      expect(instance.getContentSourceLabel()).to.equal('SharePoint');
    });

    it('should return "Google Drive" if sourceLocation includes "gdrive:"', () => {
      instance.siteStore.contentSourceType = 'google';
      expect(instance.getContentSourceLabel()).to.equal('Google Drive');
    });

    it('should return "Document Authoring" if a label is provided', () => {
      instance.siteStore.contentSourceType = 'markup';
      instance.siteStore.contentSourceEditLabel = 'Document Authoring';
      expect(instance.getContentSourceLabel()).to.equal('Document Authoring');
    });

    it('should return "BYOM" for everything else', () => {
      instance.siteStore.contentSourceType = 'markup';
      expect(instance.getContentSourceLabel()).to.equal('BYOM');
    });
  });

  describe('fireEvent', async () => {
    let sandbox;
    let instance;
    let listenerStub;

    beforeEach(async () => {
      sandbox = sinon.createSandbox();
      instance = appStore;
      await instance.loadContext(sidekickElement, defaultSidekickConfig);
      await waitUntil(() => instance.status.webPath);
      listenerStub = sandbox.stub();
    });

    afterEach(() => {
      sandbox.restore();
    });

    it('dispatches event on sidekick element with default detail', async () => {
      sidekickElement.addEventListener('custom:foo', listenerStub);
      instance.fireEvent('custom:foo');

      expect(listenerStub.calledOnce).to.be.true;
      const { detail } = listenerStub.args[0][0];
      expect(detail.config.devUrl).to.equal('http://localhost:3000/');
      expect(detail.location.host).to.equal('localhost:2000');
      expect(detail.status.webPath).to.equal('/');
    });

    it('dispatches event on sidekick element with custom detail', async () => {
      sidekickElement.addEventListener('foo', listenerStub);
      instance.fireEvent('foo', { foo: 'bar' });

      expect(listenerStub.calledWithMatch({ detail: { foo: 'bar' } })).to.be.true;
    });
  });
});
