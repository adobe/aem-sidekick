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
import { setAuthToken } from './auth.js';
import {
  addProject,
  getProjectFromUrl,
  toggleProject,
  deleteProject,
  isValidProject,
  getProject,
  getProjectMatches,
  getProjects,
} from './project.js';
import { ADMIN_ORIGIN } from './utils/admin.js';

/**
 * Updates the auth token via external messaging API (admin only).
 * @param {Object} message The message object
 * @param {string} message.owner The project owner
 * @param {string} message.authToken The auth token
 * @param {number} message.exp The token expiry in seconds since epoch
 * @param {chrome.runtime.MessageSender} sender The sender
 * @returns {Promise<string>} The action's response
 */
async function updateAuthToken({
  owner, authToken, exp,
}, sender) {
  const { url } = sender;
  if (owner) {
    try {
      if (new URL(url).origin === ADMIN_ORIGIN
        && authToken !== undefined) {
        await setAuthToken(owner, authToken, exp);
        return 'close';
      }
    } catch (e) {
      // ignore
    }
  }
  return 'invalid message';
}

/**
 * Adds or removes a project based on the tab's URL
 * @param {chrome.tabs.Tab} tab The tab
 */
async function addRemoveProject(tab) {
  const matches = await getProjectMatches(await getProjects(), tab);
  const config = matches.length === 1 && !matches[0].transient
    ? matches[0] : await getProjectFromUrl(tab);
  if (isValidProject(config)) {
    const { owner, repo } = config;
    const project = await getProject(config);
    if (!project) {
      await addProject(config);
    } else {
      await deleteProject(`${owner}/${repo}`);
    }
    await chrome.tabs.reload(tab.id, { bypassCache: true });
  }
}

/**
 * Enables or disables a project based on the tab's URL
 * @param {chrome.tabs.Tab} tab The tab
 */
async function enableDisableProject(tab) {
  const { id } = tab;
  const cfg = await getProjectFromUrl(tab);
  if (await toggleProject(cfg)) {
    await chrome.tabs.reload(id, { bypassCache: true });
  }
}

/**
 * Opens the view document source popup.
 * @param {chrome.tabs.Tab} tab The tab
 */
async function openViewDocSource({ id }) {
  chrome.windows.create({
    url: chrome.runtime.getURL(`/views/doc-source/index.html?tabId=${id}`),
    type: 'popup',
    width: 740,
  });
}

/**
 * Checks if the view document source popup needs to be opened.
 * @param {number} id The tab ID
 */
export async function checkViewDocSource(id) {
  try {
    const tab = await chrome.tabs.get(id);
    if (!tab || !tab.url || !tab.active) {
      return;
    }
    const u = new URL(tab.url);
    const vds = u.searchParams.get('view-doc-source');
    if (vds && vds === 'true') {
      // @ts-ignore
      await openViewDocSource({ id });
    }
  } catch (e) {
    log.warn(`Error checking view document source for tab ${id}`, e);
  }
}

/**
 * Actions which can be executed via internal messaging API.
 * @type {Object} The internal actions
 */
export const internalActions = {
  addRemoveProject,
  enableDisableProject,
  openViewDocSource,
};

/**
 * Actions which can be executed via external messaging API.
 * @type {Object} The external actions
 */
export const externalActions = {
  updateAuthToken,
  // todo: loadSidekick
  // todo: closePalette
};
