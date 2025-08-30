/*
 * Copyright 2024 Adobe. All rights reserved.
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
import { expect, waitUntil } from '@open-wc/testing';
import sinon from 'sinon';
import { AppStore } from '../../../src/extension/app/store/app.js';
import { AdminClient } from '../../../src/extension/app/utils/admin-client.js';
import { SidekickTest } from '../../sidekick-test.js';
import { defaultSidekickConfig } from '../../fixtures/sidekick-config.js';
import chromeMock from '../../mocks/chrome.js';
import { error, recursiveQuery } from '../../test-utils.js';
import {
  defaultJobDetailsResponse,
  defaultJobStatusResponse,
  defaultSharepointStatusResponse,
  defaultStartJobResponse,
} from '../../fixtures/helix-admin.js';

// @ts-ignore
window.chrome = chromeMock;

function mockFetchSuccess({
  method = 'get', api = 'status', path = '/', editUrl = '',
} = {}) {
  const url = new URL(`https://admin.hlx.page/${api}/adobe/aem-boilerplate/main${path}`);
  if (editUrl) {
    url.searchParams.append('editUrl', editUrl);
  }
  let body = null;
  if (api === 'status') {
    body = defaultSharepointStatusResponse;
  } else if (api === 'job') {
    body = path.endsWith('/details')
      ? defaultJobDetailsResponse
      : defaultJobStatusResponse;
  } else if (api === 'preview' || api === 'live') {
    body = path.endsWith('/*')
      ? defaultStartJobResponse
      : defaultJobStatusResponse[api];
  }
  if (!body) {
    body = defaultSharepointStatusResponse[api];
  }
  fetchMock[method](url, body, { overwriteRoutes: true });
}

function mockFetchError({
  method = 'get', api = 'status', path = '/', editUrl = '', status = 502, headers = {},
} = {}) {
  const url = new URL(`https://admin.hlx.page/${api}/adobe/aem-boilerplate/main${path}`);
  if (editUrl) {
    url.searchParams.append('editUrl', editUrl);
  }
  fetchMock[method](url, {
    status,
    headers,
  }, { overwriteRoutes: true });
}

describe('Test Admin Client', () => {
  let appStore;
  let sidekickTest;
  let adminClient;
  let showToastStub;
  const sandbox = sinon.createSandbox();

  beforeEach(async () => {
    appStore = new AppStore();
    showToastStub = sandbox.stub(appStore, 'showToast');
    sandbox.stub(appStore, 'fireEvent');

    sidekickTest = new SidekickTest(defaultSidekickConfig, appStore);
    sidekickTest
      .mockFetchStatusSuccess()
      .mockFetchProfileSuccess()
      .mockFetchSidekickConfigNotFound();

    await appStore.loadContext(sidekickTest.sidekick, defaultSidekickConfig);

    adminClient = new AdminClient(appStore);
  });

  afterEach(() => {
    sidekickTest.destroy();
    sandbox.restore();
  });

  describe('createUrl', () => {
    it('creates an admin url', () => {
      const url = adminClient.createUrl('status');
      expect(url.toString()).to.equal('https://admin.hlx.page/status/adobe/aem-boilerplate/main');
    });

    it('creates an admin url with path and search params', () => {
      const url = adminClient.createUrl('status', '/', new URLSearchParams({ foo: 'bar' }));
      expect(url.toString()).to.equal('https://admin.hlx.page/status/adobe/aem-boilerplate/main/?foo=bar');
    });
  });

  describe('getStatus', () => {
    it('returns status JSON', async () => {
      mockFetchSuccess();
      const res = await adminClient.getStatus('/');
      expect(res.webPath).to.equal('/');
    });

    it('returns status JSON with editUrl', async () => {
      mockFetchSuccess({ editUrl: 'auto' });
      const res = await adminClient.getStatus('/', 'auto');
      expect(res.webPath).to.equal('/');
    });

    it('returns status in case of error', async () => {
      const opts = { status: 404 };
      mockFetchError(opts);
      const res = await adminClient.getStatus('/');
      expect(res).to.be.deep.equal(opts);
      expect(showToastStub.calledOnce).to.be.true;
    });

    it('returns status in case of 401', async () => {
      const opts = { status: 401 };
      mockFetchError(opts);
      const res = await adminClient.getStatus('/');
      expect(res).to.be.deep.equal(opts);
      expect(showToastStub.calledOnce).to.be.false;
    });

    it('returns null if fetch fails', async () => {
      sandbox.stub(window, 'fetch').throws(error);
      const res = await adminClient.getStatus('/foo');
      expect(res).to.be.null;
      expect(showToastStub.calledOnce).to.be.true;
    });
  });

  describe('getProfile', () => {
    it('returns profile JSON', async () => {
      const res = await adminClient.getProfile();
      expect(res).to.be.instanceOf(Object);
    });

    it('returns null if not 200', async () => {
      sidekickTest.mockFetchProfileError();
      const res = await adminClient.getProfile();
      expect(res).to.be.null;
    });

    it('returns null if fetch fails', async () => {
      sandbox.stub(window, 'fetch').throws(error);
      const res = await adminClient.getProfile();
      expect(res).to.be.null;
    });
  });

  describe('updatePreview', () => {
    it('returns preview JSON', async () => {
      mockFetchSuccess({
        method: 'post',
        api: 'preview',
      });
      const res = await adminClient.updatePreview('/');
      expect(res).to.be.instanceOf(Object);
    });

    it('returns null if not 200', async () => {
      mockFetchError({
        method: 'post',
        api: 'preview',
        status: 404,
      });
      const res = await adminClient.updatePreview('/');
      expect(res).to.be.null;
    });

    it('returns null if fetch fails', async () => {
      mockFetchError({
        method: 'post',
        api: 'preview',
      });
      sandbox.stub(window, 'fetch').throws(error);
      const res = await adminClient.updatePreview('/');
      expect(res).to.be.null;
    });
  });

  describe('updateLive', () => {
    it('returns live JSON', async () => {
      mockFetchSuccess({
        method: 'post',
        api: 'live',
      });
      const res = await adminClient.updateLive('/');
      expect(res).to.be.instanceOf(Object);
    });

    it('deletes live resource', async () => {
      mockFetchSuccess({
        method: 'delete',
        api: 'live',
      });
      const res = await adminClient.updateLive('/', true);
      expect(res).to.be.instanceOf(Object);
    });

    it('returns null if not 200', async () => {
      mockFetchError({
        method: 'post',
        api: 'live',
        status: 404,
      });
      const res = await adminClient.updateLive('/');
      expect(res).to.be.null;
    });

    it('returns null if fetch fails', async () => {
      mockFetchError({
        method: 'post',
        api: 'live',
        status: 404,
      });
      const res = await adminClient.updateLive('/');
      sandbox.stub(window, 'fetch').throws(error);
      expect(res).to.be.null;
    });
  });

  describe('startJob', () => {
    it('should start preview job', async () => {
      mockFetchSuccess({
        method: 'post',
        api: 'preview',
        path: '/*',
      });
      const res = await adminClient.startJob('preview', ['/foo', '/bar']);
      expect(res).to.be.instanceOf(Object);
    });

    it('should start publish job', async () => {
      mockFetchSuccess({
        method: 'post',
        api: 'live',
        path: '/*',
      });
      const res = await adminClient.startJob('live', ['/foo', '/bar']);
      expect(res).to.be.instanceOf(Object);
    });

    it('should return null if not 200', async () => {
      mockFetchError({
        method: 'post',
        api: 'preview',
        path: '/*',
        status: 502,
        headers: {
          'x-error': 'AWS timeout',
        },
      });
      const res = await adminClient.startJob('preview', ['/foo', '/bar']);
      expect(res).to.be.null;
    });

    it('should return null if fetch fails', async () => {
      mockFetchError({
        method: 'post',
        api: 'preview',
        path: '/*',
      });
      sandbox.stub(window, 'fetch').throws(error);
      const res = await adminClient.startJob('preview', ['/foo', '/bar']);
      expect(res).to.be.null;
    });
  });

  describe('getJob', () => {
    it('should get job status', async () => {
      mockFetchSuccess({
        api: 'job',
        path: '/preview/123',
      });
      const res = await adminClient.getJob('preview', '123');
      expect(res).to.be.instanceOf(Object);
    });

    it('should get job status with details', async () => {
      mockFetchSuccess({
        api: 'job',
        path: '/preview/123/details',
      });
      const res = await adminClient.getJob('preview', '123', true);
      expect(res).to.be.instanceOf(Object);
      expect(res.data?.resources).to.exist;
    });

    it('should return null if not 200', async () => {
      mockFetchError({
        api: 'job',
        path: '/preview/123',
        status: 404,
      });
      const res = await adminClient.getJob('preview', '123');
      expect(res).to.be.null;
    });

    it('should return null if fetch fails', async () => {
      mockFetchError({
        api: 'job',
        path: '/preview/123',
      });
      sandbox.stub(window, 'fetch').throws(error);
      const res = await adminClient.getJob('preview', '123');
      expect(res).to.be.null;
    });
  });

  describe('should handle rate limiting', () => {
    let toast;

    beforeEach(() => {
      showToastStub.callsFake((t) => {
        toast = t;
      });
    });

    it('should handle 429 error', async () => {
      mockFetchError({
        method: 'post',
        api: 'preview',
        status: 429,
      });
      await adminClient.updatePreview('/');
      expect(showToastStub.calledOnce).to.be.true;
      expect(toast.message).to.match(/429/);
      expect(toast.message).to.match(/by AEM/);
      expect(toast.variant).to.equal('warning');
    });

    it('should handle 503 error with 429 in x-error header', async () => {
      mockFetchError({
        method: 'post',
        api: 'preview',
        status: 503,
        headers: {
          'x-error': 'unable to handle onedrive (429)',
        },
      });
      await adminClient.updatePreview('/');
      expect(showToastStub.calledOnce).to.be.true;
      expect(toast.message).to.match(/429/);
      expect(toast.message).to.match(/by Microsoft/);
      expect(toast.variant).to.equal('warning');
    });
  });

  describe('should handle errors', () => {
    let toast;
    let closeToastStub;

    beforeEach(() => {
      closeToastStub = sandbox.stub(appStore, 'closeToast');
      showToastStub.callsFake((t) => {
        toast = t;
      });
      sidekickTest.createSidekick();
    });

    it('should handle 4xx status error', async () => {
      showToastStub.restore();
      const showToastSpy = sandbox.spy(appStore, 'showToast');
      const showModalStub = sandbox.spy(appStore, 'showModal');
      mockFetchError({
        path: '/foo',
        status: 404,
        headers: {
          'x-error': '[admin] Unable to preview \'/foo\': File not found',
          'x-error-code': 'AEM_BACKEND_NOT_FOUND',
        },
      });
      await adminClient.getStatus('/foo');
      expect(showToastSpy.calledOnce).to.be.true;
      [toast] = showToastSpy.getCall(0).args;
      expect(toast.message).to.equal('(404) File not found. Source document either missing or not shared with AEM.');
      expect(toast.variant).to.equal('warning');

      await waitUntil(() => recursiveQuery(sidekickTest.sidekick, '.toast-container'));
      const detailsButton = recursiveQuery(sidekickTest.sidekick, '.toast-container sp-action-button');
      expect(detailsButton).to.exist;
      expect(detailsButton.textContent.trim()).to.equal('Details');
      detailsButton.click();

      await waitUntil(() => showModalStub.calledOnce);
      expect(showModalStub.calledWith({
        type: 'error',
        data: {
          headline: 'Error details',
          message: 'File not found',
        },
      })).to.be.true;

      expect(closeToastStub.calledOnce).to.be.true;
    });

    it('should show x-error on 400 preview error', async () => {
      mockFetchError({
        path: '/foo',
        method: 'post',
        api: 'preview',
        status: 400,
        headers: {
          'x-error': '[admin] Foo is invalid',
        },
      });
      await adminClient.updatePreview('/foo');
      expect(showToastStub.calledOnce).to.be.true;
      expect(toast.message).to.equal('(400) Foo is invalid');
      expect(toast.variant).to.equal('warning');

      appStore.closeToast();
      expect(closeToastStub.calledOnce).to.be.true;
    });

    it('should handle 5xx preview error', async () => {
      mockFetchError({
        path: '/foo',
        method: 'post',
        api: 'preview',
        status: 503,
        headers: {
          'x-error': '[admin] Unable to fetch \'/foo.md\' from \'onedrive\': (500)',
          'x-error-code': 'AEM_BACKEND_FETCH_FAILED',
        },
      });
      await adminClient.updatePreview('/foo');
      expect(showToastStub.calledOnce).to.be.true;
      expect(toast.message).to.equal('(503) Unable to fetch /foo.md from onedrive.');
      expect(toast.variant).to.equal('negative');
      appStore.closeToast();
    });

    it('should handle 5xx live error', async () => {
      mockFetchError({
        method: 'post',
        api: 'live',
        status: 500,
      });
      await adminClient.updateLive('/');
      expect(showToastStub.calledOnce).to.be.true;
      expect(toast.message).to.match(/Publication failed/);
      expect(toast.variant).to.equal('negative');

      appStore.closeToast();
    });

    it('should handle fatal error', async () => {
      mockFetchError({
        method: 'post',
        api: 'preview',
      });
      sandbox.stub(window, 'fetch').throws(error);
      const res = await adminClient.updatePreview('/');
      expect(showToastStub.calledOnce).to.be.true;
      expect(toast.message).to.match(/Apologies/);
      expect(toast.variant).to.equal('negative');
      expect(res).to.be.null;

      appStore.closeToast();
    });

    it('should handle start job error', async () => {
      mockFetchError({
        method: 'post',
        api: 'live',
        path: '/*',
        status: 500,
      });
      const res = await adminClient.startJob('live', ['/foo', '/bar']);
      expect(showToastStub.calledOnce).to.be.true;
      expect(toast.message).to.match(/Publication failed/);
      expect(toast.variant).to.equal('negative');
      expect(res).to.be.null;
    });

    it('should handle job status error', async () => {
      mockFetchError({
        api: 'job',
        path: '/publish/123',
        status: 404,
      });
      const res = await adminClient.getJob('publish', '123');
      expect(showToastStub.calledOnce).to.be.true;
      expect(toast.message).to.match(/404/);
      expect(toast.variant).to.equal('warning');
      expect(res).to.be.null;
    });
  });

  describe('getLocalizedError', () => {
    let path = '/foo';

    it('should return localized error for status 404', () => {
      sandbox.stub(appStore, 'isEditor').returns(true);
      const [res] = adminClient.getLocalizedError(
        'status',
        path,
        404,
        `[admin] Unable to preview '${path}': File not found`,
        'AEM_BACKEND_NOT_FOUND',
      );
      expect(res).to.equal('(404) File not found. Source document either missing or not shared with AEM.');
    });

    it('should return localized errors for status 400', () => {
      const [res1] = adminClient.getLocalizedError(
        'preview',
        path,
        400,
        `[admin] Unable to preview '${path}': Unable to parse SVG XML`,
        'AEM_BACKEND_SVG_PARSING_FAILED',
      );
      expect(res1).to.match(/invalid XML/);

      const [res2] = adminClient.getLocalizedError(
        'preview',
        path,
        400,
        `[admin] Unable to preview '${path}': Script or event handler detected in SVG at: /svg`,
        'AEM_BACKEND_SVG_SCRIPTING_DETECTED',
      );
      expect(res2).to.match(/illegal scripting detected/);

      const [res3] = adminClient.getLocalizedError(
        'preview',
        path,
        400,
        `[admin] Unable to preview '${path}': Expected XML content with an SVG root item`,
        'AEM_BACKEND_SVG_ROOT_ITEM_MISSING',
      );
      expect(res3).to.match(/root item missing/);
    });

    it('should return localized error without details', () => {
      path = '/foo';
      const [res] = adminClient.getLocalizedError(
        'preview',
        path,
        400,
        '[admin] Unable to preview \'$1\': Content type header is missing',
        'AEM_BACKEND_NO_CONTENT_TYPE',
      );
      expect(res).to.equal('(400) Content type header is missing');
    });

    it('should return localized error for failed config updates', () => {
      path = '/.helix/config.json';
      const [res] = adminClient.getLocalizedError(
        'preview',
        path,
        500,
        `[admin] Unable to fetch '${path}' from 'onedrive': backend read error`,
        'AEM_BACKEND_FETCH_FAILED',
      );
      expect(res).to.equal('(500) Failed to activate configuration: Unable to fetch /.helix/config.json from onedrive.');
    });

    it('should return localized error with details', () => {
      path = '/foo.mp4';
      const [res, details] = adminClient.getLocalizedError(
        'preview',
        path,
        409,
        `[admin] Unable to preview '${path}': MP4 is longer than 2 minutes: 2m 20s`,
        'AEM_BACKEND_MP4_TOO_LONG',
      );
      expect(res).to.equal('(409) Unable to preview /foo.mp4: MP4 is longer than 2 minutes');
      expect(details).to.equal('MP4 is longer than 2 minutes: 2m 20s');
    });

    it('should return localized error for 401 on bulk operation', () => {
      path = '/*';
      const [res] = adminClient.getLocalizedError('publish', path, 401);
      expect(res).to.equal('You need to sign in to publish more than 100 files.');
    });

    it('should return localized error fallbacks', () => {
      const [res1] = adminClient.getLocalizedError('publish', path, 404);
      expect(res1).to.match(/generate preview first/);

      const [res2] = adminClient.getLocalizedError('publish', path, 500);
      expect(res2).to.match(/Publication failed/);
    });

    it('should return generic localized error with x-error details', async () => {
      const [res1] = await adminClient.getLocalizedError(
        'foo',
        path,
        503,
        '[admin] foo went wrong',
      );
      expect(res1).to.equal('(503) An error occurred: foo went wrong');

      // unknown error code
      const [res2] = adminClient.getLocalizedError(
        'foo',
        path,
        415,
        '[admin] foo went wrong',
        'AEM_BACKEND_UNKNOWN_ERROR_CODE',
      );
      expect(res2).to.equal('(415) An error occurred: foo went wrong');

      // error code but template differs from x-error header
      const [res3] = adminClient.getLocalizedError(
        'foo',
        path,
        400,
        '[admin] foo went wrong',
        'AEM_BACKEND_NO_CONTENT_TYPE',
      );
      expect(res3).to.equal('(400) An error occurred: foo went wrong');
    });
  });
});
