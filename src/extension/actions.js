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

import { setAuthToken } from './auth.js';
import {
  addProject,
  getProjects,
  getProjectFromUrl,
  toggleProject,
  deleteProject,
  isValidProject,
  getGitHubSettings,
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
  const projects = await getProjects();
  const project = await getProjectFromUrl(url);
  if (isValidProject(project)) {
    const { owner, repo } = project;
    const reload = () => chrome.tabs.reload(id, { bypassCache: true });
    const projectExists = !!projects.find((p) => p.owner === owner && p.repo === repo);
    if (!projectExists) {
      await addProject(project);
      reload();
    } else {
      await deleteProject(`${owner}/${repo}`);
      reload();
    }
  }
}

/**
 * Enables or disables a project based on the tab's URL
 * @param {chrome.tabs.Tab} tab The tab
 */
async function enableDisableProject({ id, url }) {
  const cfg = await getProjectFromUrl(url);
  if (await toggleProject(cfg)) {
    chrome.tabs.reload(id, { bypassCache: true });
  }
}

/**
 * Opens the preview URL of a project based on a GitHub URL
 * @param {chrome.tabs.Tab} tab The tab
 */
async function openPreview({ url }) {
  const { owner, repo, ref = 'main' } = getGitHubSettings(url);
  if (owner && repo) {
    chrome.tabs.create({
      url: `https://${ref}--${repo}--${owner}.hlx.page/`,
    });
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
  // todo: open view doc source
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
