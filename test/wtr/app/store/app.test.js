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
import { expect, waitUntil } from '@open-wc/testing';
import { AppStore } from '../../../../src/extension/app/store/app.js';
import chromeMock from '../../mocks/chrome.js';
import {
  mockFetchConfigJSONNotFound,
  mockFetchConfigWithPluginsJSONSuccess,
  mockGdriveFetchStatusEditURLSuccess,
  mockFetchStatusNotFound,
  mockFetchStatusServerError,
  mockFetchStatusSuccess,
  mockFetchStatusUnauthorized,
} from '../../mocks/helix-admin.js';
import { mockFetchEnglishMessagesSuccess } from '../../mocks/i18n.js';
import { defaultSidekickConfig } from '../../fixtures/sidekick-config.js';
import { EventBus } from '../../../../src/extension/app/utils/event-bus.js';
import { EVENTS, MODALS } from '../../../../src/extension/app/constants.js';
import { mockHelixEnvironment, restoreEnvironment } from '../../mocks/environment.js';
import { getAdminFetchOptions, getAdminUrl } from '../../../../src/extension/app/utils/helix-admin.js';

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

    expect(appStore.siteStore.plugins.length).to.eq(8);
    expect(appStore.siteStore.scriptUrl).to.eq('https://www.hlx.live/tools/sidekick/index.js');
    expect(appStore.siteStore.host).to.eq('custom-host.com');
    expect(appStore.siteStore.innerHost).to.eq('https://custom-preview-host.com');
    expect(appStore.siteStore.liveHost).to.eq('https://custom-live-host.com');
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
      const callback = sinon.spy();
      const eventBus = EventBus.instance;
      eventBus.addEventListener(EVENTS.OPEN_MODAL, callback);
      appStore.showWait('test');
      expect(callback.calledOnce).to.be.true;
      expect(callback.args[0][0].detail).to.deep.equal({
        type: MODALS.WAIT,
        data: { message: 'test' },
      });
    });

    it('hideWait()', async () => {
      const callback = sinon.spy();
      const eventBus = EventBus.instance;
      eventBus.addEventListener(EVENTS.CLOSE_MODAL, callback);
      appStore.hideWait();
      expect(callback.calledOnce).to.be.true;
    });
  });

  describe('show toast', async () => {
    it('showWait()', async () => {
      const callback = sinon.spy();
      const eventBus = EventBus.instance;
      eventBus.addEventListener(EVENTS.SHOW_TOAST, callback);
      appStore.showToast('test');
      expect(callback.calledOnce).to.be.true;
      expect(callback.args[0][0].detail).to.deep.equal({
        message: 'test',
        variant: 'info',
        timeout: 2000,
      });
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
});
