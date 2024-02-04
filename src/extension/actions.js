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
  getGitHubSettings,
  getProject,
} from './project.js';

/**
 * Updates the auth token via external messaging API (admin only).
 * @param {Object} message The message object
 * @param {string} message.owner The project owner
 * @param {string} message.repo The project repository
 * @param {string} message.authToken The auth token
 * @param {number} message.exp The token expiry in seconds since epoch
 * @param {chrome.runtime.MessageSender} sender The sender
 * @returns {Promise<string>} The action's response
 */
async function updateAuthToken({
  owner, repo, authToken, exp,
}, sender) {
  const { url } = sender;
  if (owner && repo) {
    try {
      if (new URL(url).origin === 'https://admin.hlx.page'
        && authToken !== undefined) {
        await setAuthToken(owner, repo, authToken, exp);
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
async function addRemoveProject({ id, url }) {
  const config = await getProjectFromUrl(url);
  if (isValidProject(config)) {
    const { owner, repo } = config;
    const project = await getProject(config);
    if (!project) {
      await addProject(config);
    } else {
      await deleteProject(`${owner}/${repo}`);
    }
    await chrome.tabs.reload(id, { bypassCache: true });
  }
}

/**
 * Enables or disables a project based on the tab's URL
 * @param {chrome.tabs.Tab} tab The tab
 */
async function enableDisableProject({ id, url }) {
  const cfg = await getProjectFromUrl(url);
  if (await toggleProject(cfg)) {
    await chrome.tabs.reload(id, { bypassCache: true });
  }
}

/**
 * Opens the preview URL of a project based on a GitHub URL
 * @param {chrome.tabs.Tab} tab The tab
 */
async function openPreview({ url }) {
  const { owner, repo, ref } = getGitHubSettings(url);
  if (owner && repo) {
    await chrome.tabs.create({
      url: `https://${ref}--${repo}--${owner}.hlx.page/`,
    });
  }
}

/**
 * Opens the view document source popup.
 * @param {chrome.tabs.Tab} tab The tab
 */
async function openViewDocSource({ id }) {
  chrome.windows.create({
    url: chrome.runtime.getURL(`/view-doc-source/index.html?tabId=${id}`),
    type: 'popup',
    width: 740,
  });
}

/**
 * Checks if the view document source popup needs to be opened.
 * @param {number} id The tab ID
 */
export async function checkViewDocSource(id) {
  const tab = await chrome.tabs.get(id);
  if (!tab || !tab.url || !tab.active) {
    return;
  }
  try {
    const u = new URL(tab.url);
    const vds = u.searchParams.get('view-doc-source');
    if (vds && vds === 'true') {
      // @ts-ignore
      await openViewDocSource({ id });
    }
  } catch (e) {
    log.warn(`Error checking view document source for url: ${tab.url}`, e);
  }
}

/**
 * Actions which can be executed via internal messaging API.
 * @type {Object} The internal actions
 */
export const internalActions = {
  addRemoveProject,
  enableDisableProject,
  openPreview,
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
