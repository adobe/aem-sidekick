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

/**
 * @typedef {import('../store/site.js').SiteStore} SiteStore
 */

/**
 * Creates an Admin URL for an API and path.
 * @private
 * @param {SiteStore} siteStore The sidekick config object
 * @param {string} api The API endpoint to call
 * @param {string} path The current path
 * @returns {URL} The admin URL
 */
export function getAdminUrl({
  owner, repo, ref, adminVersion,
}, api, path = '', searchParams = new URLSearchParams()) {
  const adminUrl = new URL([
    'https://admin.hlx.page/',
    api,
    `/${owner}`,
    `/${repo}`,
    `/${ref}`,
    path,
  ].join(''));
  if (adminVersion) {
    searchParams.append('hlx-admin-version', adminVersion);
  }
  searchParams.forEach((value, key) => {
    adminUrl.searchParams.append(key, value);
  });
  return adminUrl;
}

/**
 * Returns the fetch options for admin requests
 * @param {boolean} omitCredentials Should we omit the credentials
 * @returns {object}
 */
export function getAdminFetchOptions(omitCredentials = false) {
  const opts = {
    cache: 'no-store',
    credentials: omitCredentials ? 'omit' : 'include',
    headers: {},
  };
  return opts;
}

/**
 * Calls an Admin URL for an API and path.
 * @private
 * @param {SiteStore} siteStore The sidekick config object
 * @param {Object} opts The options
 * @param {string} [opts.api] The API endpoint to call
 * @param {string} [opts.path] The current path
 * @param {URLSearchParams} [opts.searchParams] The search parameters
 * @param {string} [opts.method] The method to use
 * @param {Object} [opts.body] The body to send
 * @param {boolean} [opts.omitCredentials] Should we omit the credentials
 * @returns {Promise<Response>} The admin response
 */
export async function callAdmin(siteStore, {
  api = 'status',
  path = '',
  searchParams = new URLSearchParams(),
  method = 'GET',
  body,
  omitCredentials = false,
}) {
  const url = getAdminUrl(siteStore, api, path, searchParams);
  const resp = await fetch(url, {
    cache: 'no-store',
    credentials: omitCredentials ? 'omit' : 'include',
    headers: {},
    method,
    body,
  });
  if (!resp.ok) {
    // error handling
  }
  return resp;
}
