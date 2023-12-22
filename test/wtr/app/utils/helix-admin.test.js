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

import { expect } from '@open-wc/testing';
import { getAdminUrl } from '../../../../src/extension/app/utils/helix-admin.js';

describe('helix-admin', () => {
  describe('getAdminUrl', () => {
    const siteStore = {
      owner: 'ownerName',
      repo: 'repoName',
      ref: 'refName',
      adminVersion: '1.0',
    };

    it('creates a correct URL with all parameters', () => {
      // @ts-ignore
      const url = getAdminUrl(siteStore, 'preview', '/path/to/resource');
      expect(url.toString()).to.equal('https://admin.hlx.page/preview/ownerName/repoName/refName/path/to/resource?hlx-admin-version=1.0');
    });

    it('creates a correct URL with default path', () => {
      // @ts-ignore
      const url = getAdminUrl(siteStore, 'preview');
      expect(url.toString()).to.equal('https://admin.hlx.page/preview/ownerName/repoName/refName?hlx-admin-version=1.0');
    });

    it('includes adminVersion when specified', () => {
      // @ts-ignore
      const url = getAdminUrl(siteStore, 'apiEndpoint', '/path');
      expect(url.searchParams.get('hlx-admin-version')).to.equal('1.0');
    });

    it('omits adminVersion when not specified', () => {
      // @ts-ignore
      const url = getAdminUrl({ ...siteStore, adminVersion: undefined }, 'apiEndpoint', '/path');
      // @ts-ignore
      expect(url.searchParams.has('hlx-admin-version')).to.equal(false);
    });
  });
});
