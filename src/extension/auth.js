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

function getRandomId() {
  return Math.floor(Math.random() * 1000000);
}

/**
 * Sets the x-auth-token header for all requests to the Admin API if project config
 * has an auth token. Also sets the Access-Control-Allow-Origin header for
 * all requests from tools.aem.live and labs.aem.live.
 * @returns {Promise<void>}
 */
export async function configureAuthAndCorsHeaders() {
  try {
    // remove session rules first
    await chrome.declarativeNetRequest.updateSessionRules({
      removeRuleIds: (await chrome.declarativeNetRequest.getSessionRules())
        .map((rule) => rule.id),
    });
    // find projects with auth tokens and add rules for each
    const projects = await getConfig('session', 'projects') || [];
    const addRulesPromises = projects.map(async ({
      owner, repo, authToken, siteToken,
    }) => {
      const rules = [];
      if (authToken) {
        rules.push({
          id: getRandomId(),
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
            excludedInitiatorDomains: ['da.live'],
            regexFilter: `^https://${adminHost}/(config/${owner}\\.json|[a-z]+/${owner}/.*)`,
            requestDomains: [adminHost],
            requestMethods: ['get', 'post', 'delete'],
            resourceTypes: ['xmlhttprequest'],
          },
        });

        const corsFilters = [`^https://[0-9a-z-]+--[0-9a-z-]+--${owner}\\.aem\\.(page|live|reviews)/.*`];
        const project = await getConfig('sync', `${owner}/${repo}`);
        if (project) {
          const { host, previewHost, liveHost } = project;

          const additionalFilters = [host, previewHost, liveHost]
            .filter(Boolean) // Filter out undefined or null values
            .map((domain) => `^https://${domain}/.*`);

          corsFilters.push(...additionalFilters);
        }

        const corsRules = corsFilters.map((regexFilter) => ({
          id: getRandomId(),
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
        }));

        rules.push(...corsRules);
      }

      if (siteToken) {
        rules.push({
          id: getRandomId(),
          priority: 1,
          action: {
            type: 'modifyHeaders',
            requestHeaders: [{
              operation: 'set',
              header: 'authorization',
              value: `token ${siteToken}`,
            }],
          },
          condition: {
            regexFilter: `^https://[a-z0-9-]+--${repo}--${owner}\\.aem\\.(page|live|reviews)/.*`,
            requestMethods: ['get', 'post'],
            resourceTypes: [
              'main_frame',
              'sub_frame',
              'script',
              'stylesheet',
              'image',
              'xmlhttprequest',
              'media',
              'font',
              'other',
            ],
          },
        });
      }

      log.debug(`addAuthTokensHeaders: added rules for ${owner}`);
      return rules;
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
 * @param {string} authToken The auth token
 * @param {number} [authTokenExpiry] The auth token expiry in seconds since epoch
 * @param {string} [siteToken] The site token
 * @param {number} [siteTokenExpiry] The site token expiry in seconds since epoch
 * @param {string} [picture] The user picture
 * @returns {Promise<void>}
 */
export async function setAuthToken(
  owner,
  repo,
  authToken,
  authTokenExpiry = 0,
  siteToken = '',
  siteTokenExpiry = 0,
  picture = undefined,
) {
  if (owner) {
    const projects = await getConfig('session', 'projects') || [];
    const orgHandle = owner;
    const orgExists = projects.find(({ id }) => id === orgHandle);
    const siteHandle = `${owner}/${repo}`;
    const siteExists = projects.find(({ id }) => id === siteHandle);
    if (authToken) {
      authTokenExpiry *= 1000; // store in milliseconds
      if (!orgExists) {
        projects.push({
          id: orgHandle,
          owner,
          repo,
          authToken,
          authTokenExpiry,
          picture,
        });
      } else {
        const orgIndex = projects.findIndex(({ id }) => id === orgHandle);
        projects[orgIndex].authToken = authToken;
        projects[orgIndex].authTokenExpiry = authTokenExpiry;
        projects[orgIndex].picture = picture;
      }
    } else if (orgExists) {
      // remove auth token from session storage
      const orgIndex = projects.findIndex(({ id }) => id === orgHandle);
      projects.splice(orgIndex, 1);
    }
    if (siteToken) {
      if (!siteExists) {
        projects.push({
          id: siteHandle,
          owner,
          repo,
          siteToken,
          siteTokenExpiry: siteTokenExpiry * 1000, // store in milliseconds
        });
      } else {
        const siteIndex = projects.findIndex(({ id }) => id === siteHandle);
        projects[siteIndex].siteToken = siteToken;
        projects[siteIndex].siteTokenExpiry = siteTokenExpiry;
      }
    } else if (siteExists) {
      // remove site token from session storage
      const siteIndex = projects.findIndex(({ id }) => id === siteHandle);
      projects.splice(siteIndex, 1);
    }
    await setConfig('session', { projects });
    await configureAuthAndCorsHeaders();
  }
}

/**
 * Adds the sidekick version to the user agent for requests to the Admin API.
 * @returns {Promise<void>}
 */
export async function updateUserAgent() {
  // remove dynamic rules first
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: (await chrome.declarativeNetRequest.getDynamicRules())
      .map((rule) => rule.id),
  });

  const userAgent = `${navigator.userAgent} AEMSidekick/${chrome.runtime.getManifest().version}`;
  const addRules = [{
    id: getRandomId(),
    priority: 1,
    action: {
      type: 'modifyHeaders',
      requestHeaders: [{
        header: 'User-Agent',
        operation: 'set',
        value: userAgent,
      }],
    },
    condition: {
      regexFilter: `^https://${adminHost}/.*`,
      requestDomains: [adminHost],
      requestMethods: ['get', 'post', 'delete'],
      resourceTypes: ['xmlhttprequest'],
    },
  }];

  // @ts-ignore
  await chrome.declarativeNetRequest.updateDynamicRules({ addRules });
  log.debug(`updateUserAgent: ${userAgent}`);
}
