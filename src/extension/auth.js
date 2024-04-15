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

import { log } from './log.js';
import { getConfig, removeConfig, setConfig } from './config.js';

/**
 * Sets the x-auth-token header for all requests to admin.hlx.page if project config
 * has an auth token.
 * @returns {Promise<void>}
 */
export async function addAuthTokenHeaders() {
  try {
    // remove all rules first
    await chrome.declarativeNetRequest.updateSessionRules({
      removeRuleIds: (await chrome.declarativeNetRequest.getSessionRules())
        .map((rule) => rule.id),
    });
    // find projects with auth tokens and add rules for each
    let id = 2;
    const projects = await getConfig('session', 'projects') || [];
    const addRules = [];
    const projectConfigs = (await Promise.all(projects
      .map((handle) => getConfig('session', handle))))
      .filter((cfg) => !!cfg);
    projectConfigs.forEach(({ owner, repo, authToken }) => {
      addRules.push({
        id,
        priority: 1,
        action: {
          type: 'modifyHeaders',
          requestHeaders: [{
            operation: 'set',
            header: 'x-auth-token',
            value: authToken,
          }],
        },
        condition: {
          regexFilter: `^https://admin.hlx.page/[a-z]+/${owner}/${repo}/.*`,
          requestDomains: ['admin.hlx.page'],
          requestMethods: ['get', 'post', 'delete'],
          resourceTypes: ['xmlhttprequest'],
        },
      });
      id += 1;
      log.debug(`addAuthTokensHeaders: added admin auth header rule for ${owner}/${repo}`);
    });
    if (addRules.length > 0) {
      await chrome.declarativeNetRequest.updateSessionRules({
        addRules,
      });
    }
  } catch (e) {
    log.error('addAuthTokensHeaders: unable to set auth token headers', e);
  }
}

/**
 * Sets the auth token for a given project.
 * @param {string} owner The project owner
 * @param {string} repo The project repository
 * @param {string} token The auth token
 * @param {number} [exp] The token expiry in seconds since epoch
 * @returns {Promise<void>}
 */
export async function setAuthToken(owner, repo, token, exp) {
  if (owner && repo) {
    const handle = `${owner}/${repo}`;
    const projects = await getConfig('session', 'projects') || [];
    const projectIndex = projects.indexOf(handle);
    if (token) {
      // store auth token in session storage
      await setConfig('session', {
        [handle]: {
          owner,
          repo,
          authToken: token,
          authTokenExpiry: exp ? exp * 1000 : 0, // store expiry in milliseconds
        },
      });
      if (projectIndex < 0) {
        projects.push(handle);
      }
    } else if (projectIndex >= 0) {
      // remove auth token from session storage
      await removeConfig('session', handle);
      projects.splice(projectIndex, 1);
    }
    await setConfig('session', { projects });
    await addAuthTokenHeaders();
  }
}
