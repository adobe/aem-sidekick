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
  getProjects,
  getProjectMatches,
  importLegacyProjects,
} from './project.js';
import { ADMIN_ORIGIN } from './utils/admin.js';

/**
 * Displays a browser notification.
 * @param {*} message The message to display
 * @param {number} [timeout=5000] Time to wait until notification is cleared
 */
export async function notify(message, timeout = 5000) {
  const { name: title } = chrome.runtime.getManifest();
  const notificationId = await chrome.notifications.create(
    {
      type: 'basic',
      iconUrl: 'icons/default/icon-48x48.png',
      title,
      message,
    },
  );
  // @ts-ignore
  setTimeout(() => chrome.notifications.clear(notificationId), timeout);
}

/**
 * Updates the auth token via external messaging API (admin only).
 * @param {Object} message The message object
 * @param {string} message.owner The project owner
 * @param {string} message.repo The project repo
 * @param {string} message.authToken The auth token
 * @param {number} message.exp The token expiry in seconds since epoch
 * @param {chrome.runtime.MessageSender} sender The sender
 * @returns {Promise<string>} The action's response
 */
async function updateAuthToken({
  owner, repo, authToken, exp,
}, sender) {
  const { url } = sender;
  if (owner) {
    try {
      if (new URL(url).origin === ADMIN_ORIGIN
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
async function addRemoveProject(tab) {
  const matches = await getProjectMatches(await getProjects(), tab);
  const config = matches.length === 1 && !matches[0].transient
    ? matches[0] : await getProjectFromUrl(tab);
  if (isValidProject(config)) {
    const { owner, repo } = config;
    let project = await getProject(config);
    if (!project) {
      await addProject(config);
      project = await getProject(config);
      const i18nKey = 'config_project_added';
      await notify(chrome.i18n.getMessage(i18nKey, project.project || project.id));
    } else {
      await deleteProject(`${owner}/${repo}`);
      const i18nKey = 'config_project_removed';
      await notify(chrome.i18n.getMessage(i18nKey, project.project || project.id));
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
  const project = await getProject(cfg);
  if (await toggleProject(cfg)) {
    const i18nKey = project.disabled
      ? 'config_project_enabled'
      : 'config_project_disabled';
    await notify(chrome.i18n.getMessage(i18nKey, project.project || project.id));
    await chrome.tabs.reload(id, { bypassCache: true });
  }
}

/**
 * Imports projects from legacy sidekick.
 */
async function importProjects() {
  const imported = await importLegacyProjects();
  const i18nKey = imported > 0
    ? `config_project_imported_${imported === 1 ? 'single' : 'multiple'}`
    : 'config_project_imported_none';
  await notify(chrome.i18n.getMessage(i18nKey, `${imported}`));
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
  importProjects,
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
