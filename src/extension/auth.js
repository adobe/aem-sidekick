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

/* eslint-disable no-plusplus */

import { log } from './log.js';
import { getConfig, setConfig } from './config.js';
import { ADMIN_ORIGIN } from './utils/admin.js';

const { host: adminHost } = new URL(ADMIN_ORIGIN);
/**
 * Sets the x-auth-token header for all requests to the Admin API if project config
 * has an auth token. Also sets the Access-Control-Allow-Origin header for
 * all requests from tools.aem.live and labs.aem.live.
 * @returns {Promise<void>}
 */
export async function configureAuthAndCorsHeaders() {
  try {
    // remove all rules first
    await chrome.declarativeNetRequest.updateSessionRules({
      removeRuleIds: (await chrome.declarativeNetRequest.getSessionRules())
        .map((rule) => rule.id),
    });
    // find projects with auth tokens and add rules for each
    let id = 2;
    const projects = await getConfig('session', 'projects') || [];
    const addRulesPromises = projects.map(async ({ owner, repo, authToken }) => {
      const adminRule = {
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
          regexFilter: `^https://${adminHost}/(config/${owner}.json|[a-z]+/${owner}/.*)`,
          requestDomains: [adminHost],
          requestMethods: ['get', 'post', 'delete'],
          resourceTypes: ['xmlhttprequest'],
        },
      };

      const corsFilters = [`^https://[0-9a-z-]+--[0-9a-z-]+--${owner}.aem.(live|page)/.*`];
      const project = await getConfig('sync', `${owner}/${repo}`);
      if (project) {
        const { host, previewHost, liveHost } = project;

        const additionalFilters = [host, previewHost, liveHost]
          .filter(Boolean) // Filter out undefined or null values
          .map((domain) => `^https://${domain}/.*`);

        corsFilters.push(...additionalFilters);
      }

      const corsRules = corsFilters.map((regexFilter) => {
        id += 1;
        return {
          id,
          priority: 1,
          action: {
            type: 'modifyHeaders',
            responseHeaders: [{
              header: 'Access-Control-Allow-Origin',
              operation: 'set',
              value: '*',
            }],
          },
          condition: {
            regexFilter,
            initiatorDomains: ['tools.aem.live', 'labs.aem.live'],
            requestMethods: ['get'],
            resourceTypes: ['xmlhttprequest'],
          },
        };
      });

      log.debug(`addAuthTokensHeaders: added rules for ${owner}`);
      return [adminRule, ...corsRules];
    });

    const addRules = (await Promise.all(addRulesPromises)).flat();
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
 * @param {string} repo The project repo
 * @param {string} token The auth token
 * @param {number} [exp] The token expiry in seconds since epoch
 * @returns {Promise<void>}
 */
export async function setAuthToken(owner, repo, token, exp) {
  if (owner) {
    const projects = await getConfig('session', 'projects') || [];
    const projectIndex = projects.findIndex((project) => project.owner === owner);
    if (token) {
      const authTokenExpiry = exp ? exp * 1000 : 0; // store expiry in milliseconds
      if (projectIndex < 0) {
        projects.push({
          owner,
          repo,
          authToken: token,
          authTokenExpiry,
        });
      } else {
        projects[projectIndex].authToken = token;
        projects[projectIndex].authTokenExpiry = authTokenExpiry;
      }
    } else if (projectIndex >= 0) {
      // remove auth token from session storage
      projects.splice(projectIndex, 1);
    }
    await setConfig('session', { projects });
    await configureAuthAndCorsHeaders();
  }
}
