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

import sinon from 'sinon';
import { expect } from '@open-wc/testing';
import { createAdminUrl, callAdmin } from '../../src/extension/utils/admin.js';

describe('helix-admin', () => {
  const siteStore = {
    owner: 'adobe',
    repo: 'aem-boilerplate',
    ref: 'main',
  };

  describe('getAdminUrl', () => {
    it('creates a correct URL with all parameters', () => {
      // @ts-ignore
      const url = createAdminUrl(siteStore, 'preview', '/path/to/resource');
      expect(url.toString()).to.equal('https://admin.hlx.page/preview/adobe/aem-boilerplate/main/path/to/resource');
    });

    it('creates a correct URL with default path', () => {
      // @ts-ignore
      const url = createAdminUrl(siteStore, 'preview', '/path/to/resource');
      expect(url.toString()).to.equal('https://admin.hlx.page/preview/adobe/aem-boilerplate/main/path/to/resource');
    });

    it('creates a correct URL with default ref when not specified', () => {
      const { ref: _, ...storeWithoutRef } = siteStore;
      const url = createAdminUrl(storeWithoutRef, 'preview', '/path/to/resource');
      expect(url.toString()).to.equal('https://admin.hlx.page/preview/adobe/aem-boilerplate/main/path/to/resource');
    });

    it('creates a correct URL with specified ref', () => {
      const storeWithOtherRef = { ...siteStore, ref: 'foo' };
      const url = createAdminUrl(storeWithOtherRef, 'preview', '/path/to/resource');
      expect(url.toString()).to.equal('https://admin.hlx.page/preview/adobe/aem-boilerplate/foo/path/to/resource');
    });

    it('includes adminVersion when specified', () => {
      const adminVersion = 'ci12345678';
      const url = createAdminUrl({ ...siteStore, adminVersion }, 'apiEndpoint', '/path', new URLSearchParams());
      expect(url.searchParams.get('hlx-admin-version')).to.equal(adminVersion);
    });

    it('omits adminVersion when not specified', () => {
      // @ts-ignore
      const url = createAdminUrl(siteStore, 'apiEndpoint', '/path');
      // @ts-ignore
      expect(url.searchParams.has('hlx-admin-version')).to.equal(false);
    });

    it('creates discover URL correctly', () => {
      // @ts-ignore
      const url = createAdminUrl({}, 'discover', '', new URLSearchParams('url=https://example.com'));
      expect(url.toString()).to.equal('https://admin.hlx.page/discover?url=https%3A%2F%2Fexample.com');
    });

    it('appends search parameters correctly', () => {
      const searchParams = new URLSearchParams();
      searchParams.append('param1', 'value1');
      searchParams.append('param2', 'value2');
      // @ts-ignore
      const url = createAdminUrl(siteStore, 'preview', '/path', searchParams);
      expect(url.searchParams.get('param1')).to.equal('value1');
      expect(url.searchParams.get('param2')).to.equal('value2');
    });

    describe('API v2', () => {
      it('creates correct URL for login endpoint', () => {
        const config = { ...siteStore, apiUpgrade: true };
        // @ts-ignore
        const url = createAdminUrl(config, 'login');
        expect(url.toString()).to.equal('https://api.aem.live/login?org=adobe&site=aem-boilerplate');
      });

      it('creates correct URL for logout endpoint', () => {
        const config = { ...siteStore, apiUpgrade: true };
        // @ts-ignore
        const url = createAdminUrl(config, 'logout');
        expect(url.toString()).to.equal('https://api.aem.live/logout?org=adobe&site=aem-boilerplate');
      });

      it('creates correct URL for profile endpoint', () => {
        const config = { ...siteStore, apiUpgrade: true };
        // @ts-ignore
        const url = createAdminUrl(config, 'profile');
        expect(url.toString()).to.equal('https://api.aem.live/profile?org=adobe&site=aem-boilerplate');
      });

      it('creates correct URL for other endpoints', () => {
        const config = { ...siteStore, apiUpgrade: true };
        // @ts-ignore
        const url = createAdminUrl(config, 'status', '/path/to/resource');
        expect(url.toString()).to.equal('https://api.aem.live/adobe/sites/aem-boilerplate/status/path/to/resource');
      });
    });
  });

  describe('callAdmin', () => {
    const sandbox = sinon.createSandbox();
    let fetchStub;

    beforeEach(() => {
      fetchStub = sandbox.stub(window, 'fetch');
    });

    afterEach(() => {
      sandbox.restore();
    });

    it('calls admin api', async () => {
      await callAdmin(siteStore, 'preview', '/path/to/resource');
      const url = fetchStub.getCall(0).args[0].toString();
      const options = fetchStub.getCall(0).args[1];
      expect(url).to.equal('https://admin.hlx.page/preview/adobe/aem-boilerplate/main/path/to/resource');
      expect(options.method).to.equal('get');
      expect(options.cache).to.equal('no-store');
      expect(options.credentials).to.equal('omit');
    });

    it('calls admin api with search paramater', async () => {
      await callAdmin(siteStore, 'preview', '/path/to/resource', { searchParams: new URLSearchParams('foo=bar') });
      const url = fetchStub.getCall(0).args[0];
      // @ts-ignore
      expect(url.searchParams.get('foo')).to.equal('bar');
    });

    it('calls admin api with method', async () => {
      await callAdmin(siteStore, 'preview', '/path/to/resource', { method: 'post' });
      const options = fetchStub.getCall(0).args[1];
      expect(options.method).to.equal('post');
    });

    it('calls admin api with body', async () => {
      await callAdmin(siteStore, 'preview', '/path/to/resource', { body: { key: 'value' } });
      const options = fetchStub.getCall(0).args[1];
      expect(options.body).to.equal('{"key":"value"}');
    });

    it('calls admin api with body and sets content-type header', async () => {
      await callAdmin(siteStore, 'preview', '/path/to/resource', { body: { key: 'value' } });
      const options = fetchStub.getCall(0).args[1];
      expect(options.headers).to.deep.equal({ 'Content-Type': 'application/json' });
    });

    it('calls admin api without headers when no body', async () => {
      await callAdmin(siteStore, 'preview', '/path/to/resource');
      const options = fetchStub.getCall(0).args[1];
      expect(options.headers).to.equal(undefined);
    });

    it('calls admin api with default method', async () => {
      await callAdmin(siteStore, 'preview', '/path/to/resource');
      const options = fetchStub.getCall(0).args[1];
      expect(options.method).to.equal('get');
    });

    it('calls admin api with default path', async () => {
      await callAdmin(siteStore, 'preview');
      const url = fetchStub.getCall(0).args[0].toString();
      expect(url).to.equal('https://admin.hlx.page/preview/adobe/aem-boilerplate/main');
    });

    it('calls admin api with default options', async () => {
      await callAdmin(siteStore, 'preview', '/path');
      const options = fetchStub.getCall(0).args[1];
      expect(options.method).to.equal('get');
      expect(options.body).to.equal(undefined);
    });

    it('calls admin api with job endpoint and apiUpgrade', async () => {
      const config = { ...siteStore, apiUpgrade: true };
      await callAdmin(config, 'job', '/path/to/resource');
      const url = fetchStub.getCall(0).args[0].toString();
      expect(url).to.equal('https://api.aem.live/adobe/sites/aem-boilerplate/jobs/path/to/resource');
    });
  });
});
