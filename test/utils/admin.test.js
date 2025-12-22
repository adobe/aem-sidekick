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
    owner: 'ownerName',
    repo: 'repoName',
    ref: 'refName',
  };

  describe('getAdminUrl', () => {
    it('creates a correct URL with all parameters', () => {
      // @ts-ignore
      const url = createAdminUrl(siteStore, 'preview', '/path/to/resource');
      expect(url.toString()).to.equal('https://admin.hlx.page/preview/ownerName/repoName/refName/path/to/resource');
    });

    it('creates a correct URL with default path', () => {
      // @ts-ignore
      const url = createAdminUrl(siteStore, 'preview');
      expect(url.toString()).to.equal('https://admin.hlx.page/preview/ownerName/repoName/refName');
    });

    it('includes adminVersion when specified', () => {
      // @ts-ignore
      const url = createAdminUrl({ ...siteStore, adminVersion: '1.0' }, 'apiEndpoint', '/path');
      expect(url.searchParams.get('hlx-admin-version')).to.equal('1.0');
    });

    it('omits adminVersion when not specified', () => {
      // @ts-ignore
      const url = createAdminUrl(siteStore, 'apiEndpoint', '/path');
      // @ts-ignore
      expect(url.searchParams.has('hlx-admin-version')).to.equal(false);
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
      expect(url).to.equal('https://admin.hlx.page/preview/ownerName/repoName/refName/path/to/resource');
      expect(options.method).to.equal('get');
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
      await callAdmin(siteStore, 'preview', '/path/to/resource', { body: '{}' });
      const options = fetchStub.getCall(0).args[1];
      expect(options.body).to.equal('"{}"');
    });

    it('calls admin api with default method', async () => {
      await callAdmin(siteStore, 'preview', '/path/to/resource');
      const options = fetchStub.getCall(0).args[1];
      expect(options.method).to.equal('get');
    });
  });
});
