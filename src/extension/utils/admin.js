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
 * The origin of the Admin API.
 * @type {string}
 */
export const ADMIN_ORIGIN = 'https://admin.hlx.page';

/**
 * Creates an Admin API URL for an API and path.
 * @param {Object} config The sidekick config object
 * @param {string} api The API endpoint to call
 * @param {string} [path] The resource path
 * @param {URLSearchParams} [searchParams] The search parameters
 * @returns {URL} The admin URL
 */
export function createAdminUrl(
  {
    owner, repo, ref = 'main', adminVersion,
  },
  api,
  path = '',
  searchParams = new URLSearchParams(),
) {
  const adminUrl = new URL(`${ADMIN_ORIGIN}/${api}`);
  if (owner && repo && ref) {
    adminUrl.pathname += `/${owner}/${repo}/${ref}`;
  }
  adminUrl.pathname += path;
  if (adminVersion) {
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
 * @param {Object} config The sidekick config object
 * @param {string} api The API endpoint to call
 * @param {string} [path] The resource path
 * @param {Object} [opts] The request options
 * @param {string} [opts.method] The method to use
 * @param {Object} [opts.body] The body to send
 * @param {URLSearchParams} [opts.searchParams] The search parameters
 * @param {boolean} [opts.omitCredentials] Should we omit the credentials
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
    omitCredentials = false,
  } = {},
) {
  const url = createAdminUrl(config, api, path, searchParams);
  return fetch(url, {
    cache: 'no-store',
    credentials: omitCredentials ? 'omit' : 'include',
    headers: {},
    method,
    body,
  });
}
