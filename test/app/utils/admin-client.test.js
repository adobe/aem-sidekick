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
import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import { AppStore } from '../../../src/extension/app/store/app.js';
import { AdminClient } from '../../../src/extension/app/utils/admin-client.js';
import { SidekickTest } from '../../sidekick-test.js';
import { defaultSidekickConfig } from '../../fixtures/sidekick-config.js';
import chromeMock from '../../mocks/chrome.js';
import { error } from '../../test-utils.js';
import { defaultSharepointStatusResponse } from '../../fixtures/helix-admin.js';

// @ts-ignore
window.chrome = chromeMock;

function mockFetchSuccess({
  method = 'get', api = 'status', path = '/', editUrl = '',
} = {}) {
  const url = new URL(`https://admin.hlx.page/${api}/adobe/aem-boilerplate/main${path}`);
  if (editUrl) {
    url.searchParams.append('editUrl', editUrl);
  }
  const body = api === 'status'
    ? defaultSharepointStatusResponse
    : { [api]: defaultSharepointStatusResponse[api] };
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

  describe('should handle rate limiting', () => {
    it('should handle 429 error', async () => {
      mockFetchError({
        method: 'post',
        api: 'preview',
        status: 429,
      });
      await adminClient.updatePreview('/');
      expect(showToastStub.calledOnce).to.be.true;
      expect(showToastStub.args[0][0]).to.match(/429/);
      expect(showToastStub.args[0][0]).to.match(/by AEM/);
      expect(showToastStub.args[0][1]).to.equal('warning');
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
      expect(showToastStub.args[0][0]).to.match(/429/);
      expect(showToastStub.args[0][0]).to.match(/by Microsoft/);
      expect(showToastStub.args[0][1]).to.equal('warning');
    });
  });

  describe('should handle errors', () => {
    let toast;
    let closeToastStub;

    beforeEach(() => {
      closeToastStub = sandbox.stub(appStore, 'closeToast');
      showToastStub.callsFake((message, variant, closeCallback) => {
        toast = { message, variant, closeCallback };
      });
    });

    it('should handle 4xx status errors', async () => {
      // content URL
      mockFetchError({
        status: 404,
      });
      await adminClient.getStatus('/');
      expect(showToastStub.calledOnce).to.be.true;
      expect(toast.message).to.match(/404/);
      expect(toast.message).to.match(/Check your Sidekick configuration/);
      expect(toast.variant).to.equal('warning');

      toast.closeCallback();
      expect(closeToastStub.calledOnce).to.be.true;

      // editor
      sandbox.stub(appStore, 'isEditor').returns(true);
      mockFetchError({
        status: 404,
        editUrl: 'https://adobe.sharepoint.com/sites/foo',
      });
      await adminClient.getStatus('/', 'https://adobe.sharepoint.com/sites/foo');
      expect(showToastStub.calledTwice).to.be.true;
      expect(toast.message).to.match(/404/);
      expect(toast.message).to.match(/make sure access to this document is granted/);
      expect(toast.variant).to.equal('warning');

      toast.closeCallback();
      expect(closeToastStub.calledTwice).to.be.true;
    });

    it('should handle 5xx preview error', async () => {
      mockFetchError({
        method: 'post',
        api: 'preview',
        status: 500,
      });
      await adminClient.updatePreview('/');
      expect(showToastStub.calledOnce).to.be.true;
      expect(toast.message).to.match(/Preview generation failed/);
      expect(toast.variant).to.equal('negative');

      toast.closeCallback();
      expect(closeToastStub.calledOnce).to.be.true;
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

      toast.closeCallback();
      expect(closeToastStub.calledOnce).to.be.true;
    });

    it('should handle fatal error', async () => {
      mockFetchError({
        method: 'post',
        api: 'preview',
      });
      sandbox.stub(window, 'fetch').throws(error);
      await adminClient.updatePreview('preview', '/');
      expect(showToastStub.calledOnce).to.be.true;
      expect(toast.message).to.match(/Apologies/);
      expect(toast.variant).to.equal('negative');

      toast.closeCallback();
      expect(closeToastStub.calledOnce).to.be.true;
    });
  });
});
