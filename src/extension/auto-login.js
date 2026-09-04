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

import { getConfig, removeConfig, setConfig } from './config.js';

/**
 * Adds or removes an ID from a project list stored in the given area.
 * @param {string} area The storage type
 * @param {string} prop The property name
 * @param {string} id The project ID (<code>org/site</code>)
 * @param {boolean} add <code>true</code> to add the ID, <code>false</code> to remove it
 * @returns {Promise<void>}
 */
async function storeProjectId(area, prop, id, add) {
  const ids = await getConfig(area, prop) || [];
  const index = ids.indexOf(id);
  if (add && index === -1) {
    ids.push(id);
  } else if (!add && index !== -1) {
    ids.splice(index, 1);
  }
  if (ids.length > 0) {
    await setConfig(area, { [prop]: ids });
  } else {
    await removeConfig(area, prop);
  }
}

/**
 * Returns whether auto-login is enabled for the given project.
 * @param {string} org The organization
 * @param {string} site The site
 * @returns {Promise<boolean>} <code>true</code> if auto-login is enabled
 */
export async function isAutoLogin(org, site) {
  const autoLogin = await getConfig('local', 'autoLogin') || [];
  return autoLogin.includes(`${org}/${site}`);
}

/**
 * Enables or disables auto-login for the given project.
 * @param {string} org The organization
 * @param {string} site The site
 * @param {boolean} enabled <code>true</code> to enable auto-login
 * @returns {Promise<void>}
 */
export async function setAutoLogin(org, site, enabled) {
  return storeProjectId('local', 'autoLogin', `${org}/${site}`, enabled);
}

/**
 * Returns whether an auto-login has already been attempted for the given
 * project (used to break a repeated-401 loop). Stored in local (not session)
 * storage so it is also reachable from the content script, which clears it
 * once the delivery page loads successfully.
 * @param {string} org The organization
 * @param {string} site The site
 * @returns {Promise<boolean>} <code>true</code> if an attempt was made
 */
export async function isAutoLoginAttempted(org, site) {
  const attempts = await getConfig('local', 'autoLoginAttempt') || [];
  return attempts.includes(`${org}/${site}`);
}

/**
 * Records or clears an auto-login attempt for the given project.
 * @param {string} org The organization
 * @param {string} site The site
 * @param {boolean} attempted <code>true</code> to record, <code>false</code> to clear
 * @returns {Promise<void>}
 */
export async function setAutoLoginAttempted(org, site, attempted) {
  return storeProjectId('local', 'autoLoginAttempt', `${org}/${site}`, attempted);
}
