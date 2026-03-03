/*
 * Copyright 2026 Adobe. All rights reserved.
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

/**
 * Returns the hostname (domain) from a project host value (may be domain or full URL).
 * @param {string} host
 * @returns {string}
 */
export function getHostDomain(host) {
  if (host == null || typeof host !== 'string') return '';
  host = host.trim();
  if (!host) {
    return '';
  }
  return host.startsWith('http') ? new URL(host).host : host;
}

/**
 * Adds a session rule to set Cache-Control and Pragma request headers for the given domain,
 * then removes it again after 10 seconds.
 * @param {string} domain Domain name (e.g. 'example.com')
 * @returns {Promise<boolean>} True if rule was added, else false
 */
export async function addCacheBusterRule(domain) {
  domain = getHostDomain(domain);
  if (!domain) {
    log.warn('addCacheBusterRule: no domain');
    return false;
  }
  const escapedDomain = domain.trim().replaceAll(/\./g, '\\.');

  const ruleId = Math.floor(Math.random() * 1000000);
  /** @type {chrome.declarativeNetRequest.Rule[]} */
  const addRules = [{
    id: ruleId,
    priority: 1,
    action: {
      type: 'modifyHeaders',
      requestHeaders: [
        {
          operation: 'set',
          header: 'Cache-Control',
          value: 'no-cache',
        },
        {
          operation: 'set',
          header: 'Pragma',
          value: 'no-cache',
        },
      ],
    },
    condition: {
      regexFilter: `^https://${escapedDomain}/.*`,
      requestMethods: ['get'],
      resourceTypes: [
        'main_frame',
        'sub_frame',
        'script',
        'stylesheet',
        'xmlhttprequest',
        'font',
      ],
    },
  }];

  await chrome.declarativeNetRequest.updateSessionRules({ addRules });

  // remove rule after 10 seconds
  setTimeout(() => {
    chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds: [ruleId] });
  }, 10 * 1000);

  return true;
}
