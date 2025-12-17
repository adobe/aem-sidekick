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

/**
 * @typedef {Object} AdminUrlConfig
 * @property {string} [owner] The owner of the repository.
 * @property {string} [repo] The name of the repository.
 * @property {string} [ref='main'] The reference branch, defaults to 'main'.
 * @property {string} [adminVersion] The version of the admin service to use.
 * @property {boolean} [apiUpgrade=false] <code>true</code> if the API upgrade is available.
 */

/**
 * The origin of the legacy Admin API.
 * @type {string}
 */
export const ADMIN_ORIGIN = 'https://admin.hlx.page';

/**
 * The origin of the new Admin API.
 * @type {string}
 */
export const ADMIN_ORIGIN_NEW = 'https://api.aem.live';

/**
 * Creates an Admin API URL for an API and path.
 * @param {AdminUrlConfig} config The sidekick config object
 * @param {string} api The API endpoint to call
 * @param {string} [path] The resource path
 * @param {URLSearchParams} [searchParams] The search parameters
 * @returns {URL} The admin URL
 */
export function createAdminUrl(
  {
    owner: org, repo: site, ref = 'main', apiUpgrade, adminVersion,
  },
  api,
  path = '',
  searchParams = new URLSearchParams(),
) {
  const adminUrl = new URL(`${apiUpgrade ? ADMIN_ORIGIN_NEW : ADMIN_ORIGIN}`);
  if (api === 'discover') {
    adminUrl.pathname = `/${api}/`;
  } else if (org && site) {
    if (apiUpgrade) {
      // use new api
      if (['login', 'logout', 'profile'].includes(api)) {
        adminUrl.pathname = `/${api}`;
        adminUrl.searchParams.append('org', org);
        adminUrl.searchParams.append('site', site);
      } else {
        adminUrl.pathname = `/${org}/sites/${site}/${api}`;
      }
    } else {
      // use legacy api
      adminUrl.pathname = `/${api}/${org}/${site}/${ref}`;
    }
    adminUrl.pathname += path;
  }
  if (adminVersion) {
    // use a specific ci admin version
    searchParams.append('hlx-admin-version', adminVersion);
  }
  searchParams.forEach((value, key) => {
    adminUrl.searchParams.append(key, value);
  });
  return adminUrl;
}

/**
 * Makes a call to the [AEM Admin API]{@link https://www.aem.live/docs/admin.html}
 * and returns the response.
 * @param {AdminUrlConfig} config The sidekick config object
 * @param {string} api The API endpoint to call
 * @param {string} [path] The resource path
 * @param {Object} [opts] The request options
 * @param {string} [opts.method] The method to use
 * @param {Object} [opts.body] The body to send
 * @param {URLSearchParams} [opts.searchParams] The search parameters
 * @returns {Promise<Response>} The admin response
 */
export async function callAdmin(
  config,
  api,
  path = '',
  {
    method = 'get',
    body = undefined,
    searchParams = new URLSearchParams(),
  } = {},
) {
  const url = createAdminUrl(config, api, path, searchParams);
  return fetch(url, {
    method,
    cache: 'no-store',
    credentials: 'omit',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
}
