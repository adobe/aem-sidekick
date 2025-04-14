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
  detectLegacySidekick,
  updateProject as updateProjectConfig,
} from './project.js';
import { ADMIN_ORIGIN } from './utils/admin.js';
import { getConfig } from './config.js';
import { getDisplay, setDisplay } from './display.js';
import { urlCache } from './url-cache.js';

/**
 * Updates the auth token via external messaging API (admin only).
 * @param {Object} message The message object
 * @param {string} message.owner The project owner
 * @param {string} message.repo The project repo
 * @param {string} message.authToken The auth token
 * @param {number} [message.exp] The auth token expiry in seconds since epoch
 * @param {string} [message.siteToken] The auth token
 * @param {number} [message.siteTokenExpiry] The site token expiry in seconds since epoch
 * @param {string} [message.picture] The user picture
 * @param {chrome.runtime.MessageSender} sender The sender
 * @returns {Promise<string>} The action's response
 */
async function updateAuthToken({
  owner,
  repo,
  authToken,
  exp: authTokenExpiry,
  siteToken,
  siteTokenExpiry,
  picture,
}, sender) {
  const { url } = sender;
  if (owner) {
    try {
      if (new URL(url).origin === ADMIN_ORIGIN
        && authToken !== undefined) {
        await setAuthToken(
          owner,
          repo,
          authToken,
          authTokenExpiry,
          siteToken,
          siteTokenExpiry,
          picture,
        );
        return 'close';
      }
    } catch (e) {
      // ignore
    }
  }
  return 'invalid message';
}

/**
 * Shows the sidekick if it is hidden.
 */
export async function showSidekickIfHidden() {
  const visible = await getDisplay();
  if (!visible) {
    await setDisplay(true);
    // wait for sidekick to be visible and check tab to be called by storage listener
    // eslint-disable-next-line no-promise-executor-return
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

/**
 * Notification confirmation callback
 * @param {number} tabId The tab ID
 */
export function notificationConfirmCallback(tabId) {
  return async () => {
    await chrome.tabs.reload(tabId, { bypassCache: true });
  };
}

/**
 * Shows a notification in the sidekick
 * @param {*} data
 * @param {*} callback
 */
export async function showSidekickNotification(tabId, data, callback) {
  chrome.tabs.sendMessage(tabId, { action: 'show_notification', ...data }, callback);
}

/**
 * Verifies if the origin that requested the organisations is a trusted one.
 * @param {string} origin
 * @returns {boolean} true - trusted / false - untrusted
 */
function isTrustedOrigin(origin) {
  const TRUSTED_ORIGINS = [
    ADMIN_ORIGIN,
    'https://labs.aem.live',
    'https://tools.aem.live',
    'http://localhost:3000',
  ];

  if (TRUSTED_ORIGINS.includes(origin)) {
    return true;
  }

  const TRUSTED_ORIGIN_PATTERNS = [
    /^https:\/\/[a-z0-9-]+--helix-labs-website--adobe\.aem\.(page|live)$/, // labs
    /^https:\/\/[a-z0-9-]+--helix-tools-website--adobe\.aem\.(page|live)$/, // tools
  ];

  if (TRUSTED_ORIGIN_PATTERNS.some((trustedOriginPattern) => origin.match(trustedOriginPattern))) {
    return true;
  }

  return false;
}

/**
 * Returns the organizations the user is currently authenticated for.
 * @returns {Promise<string[]>} The organizations
 */
async function getAuthInfo(_, sender) {
  const { origin } = new URL(sender.url);

  if (!isTrustedOrigin(origin)) {
    return []; // don't give out any information
  }

  const projects = await getConfig('session', 'projects') || [];
  return projects
    .filter(({ authToken, authTokenExpiry }) => !!authToken && authTokenExpiry > Date.now() / 1000)
    .map(({ owner }) => owner);
}

/**
 * Returns the configured sites.
 * @returns {Promise<Object[]>} The sites
 */
async function getSites(_, sender) {
  const { origin } = new URL(sender.url);

  if (!isTrustedOrigin(origin)) {
    return []; // don't give out any information
  }

  return (await getConfig('sync', 'projects') || [])
    .map((handle) => {
      const [org, site] = handle.split('/');
      return { org, site };
    });
}

/**
 * Launches the sidekick in the sender's tab.
 * @returns {Promise<boolean>} True if sidekick launched, else false
 */
async function launch({
  owner, repo, org, site,
}, { tab }) {
  owner = org || owner;
  repo = site || repo;
  if (owner && repo) {
    // launch sidekick with owner and repo on this url
    await urlCache.set(tab, { owner, repo });
    await setDisplay(true);
    return true;
  } else {
    log.warn('launch: missing required parameters org and site or owner and repo');
    return false;
  }
}

/**
 * Adds or removes a project based on the tab's URL
 * @param {chrome.tabs.Tab} tab The tab
 */
async function addRemoveProject(tab) {
  const matches = await getProjectMatches(await getProjects(), tab);
  const config = matches.length === 1 && !matches[0].transient
    ? matches[0] : await getProjectFromUrl(tab);

  await showSidekickIfHidden();
  if (isValidProject(config)) {
    const { owner, repo } = config;
    let project = await getProject(config);
    if (!project) {
      await addProject(config);
      project = await getProject(config);
      const i18nKey = 'config_project_added';
      await showSidekickNotification(tab.id,
        {
          message: chrome.i18n.getMessage(i18nKey, project.project || project.id),
          headline: chrome.i18n.getMessage('config_add_project_headline'),
        },
        notificationConfirmCallback(tab.id));
    } else {
      await deleteProject(`${owner}/${repo}`);
      const i18nKey = 'config_project_removed';
      await showSidekickNotification(tab.id,
        {
          message: chrome.i18n.getMessage(i18nKey, project.project || project.id),
          headline: chrome.i18n.getMessage('config_remove_project_headline'),
        },
        notificationConfirmCallback(tab.id));
    }
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

  await showSidekickIfHidden();
  if (await toggleProject(cfg)) {
    const i18nKey = project.disabled
      ? 'config_project_enabled'
      : 'config_project_disabled';
    const i18nHeadlineKey = project.disabled
      ? 'config_project_enabled_headline'
      : 'config_project_disabled_headline';

    await showSidekickNotification(tab.id,
      {
        message: chrome.i18n.getMessage(i18nKey, project.project || project.id),
        headline: chrome.i18n.getMessage(i18nHeadlineKey),
      },
      notificationConfirmCallback(id));
  }
}

/**
 * Imports projects from legacy sidekick.
 */
async function importProjects(tab) {
  const sidekickId = await detectLegacySidekick();
  await showSidekickIfHidden();
  if (!sidekickId) {
    await showSidekickNotification(tab.id,
      {
        message: chrome.i18n.getMessage('config_project_import_sidekick_not_found'),
        headline: chrome.i18n.getMessage('config_project_import_headline'),
      });
    return;
  }
  const imported = await importLegacyProjects(sidekickId);
  const i18nKey = imported > 0
    ? `config_project_imported_${imported === 1 ? 'single' : 'multiple'}`
    : 'config_project_imported_none';
  await showSidekickNotification(tab.id,
    {
      message: chrome.i18n.getMessage(i18nKey, `${imported}`),
      headline: chrome.i18n.getMessage('config_project_import_headline'),
    });
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
 * Returns the user's profile picture.
 * @param {chrome.tabs.Tab} _ The tab
 * @param {Object} message The message object
 * @param {string} message.owner The project owner
 * @returns {Promise<string>} The user picture
 */
export async function getProfilePicture(_, { owner }) {
  if (!owner) {
    return undefined;
  }
  const projects = await getConfig('session', 'projects') || [];
  return projects.find((p) => p.owner === owner)?.picture;
}

/**
 * Tries to guess if a URL is an AEM site.
 * @param {chrome.tabs.Tab} _ The tab
 * @param {Object} message The message object
 * @param {string} message.url The URL to check
 * @returns {Promise<boolean>} True if the provided URL is an AEM site
 */
export async function guessAEMSite(_, { url }) {
  try {
    const resp = await fetch(url, { redirect: 'manual' }); // don't allow redirects
    if (resp.ok) {
      const mimeType = resp.headers.get('content-type');
      if (mimeType.startsWith('text/html')) {
        // payload must match pipeline output
        const payload = await resp.text();
        const [type, html, head, titl, link, meta] = payload.substring(0, 400).split('\n');
        return type === '<!DOCTYPE html>'
          && html.startsWith('<html')
          && head === '  <head>'
          && titl.startsWith('    <title>')
          && link.startsWith('    <link rel="canonical"')
          && meta.startsWith('    <meta');
      } else if (mimeType.startsWith('application/json')) {
        // payload must match pipeline output
        try {
          const payload = await resp.json();
          return !!payload[':type'];
        } catch (e) {
          // invalid json
          return false;
        }
      } else {
        // unable to guess. assume AEM
        return true;
      }
    } else {
      if (resp.status === 0 || resp.status === 404 || resp.status >= 500) {
        // unexpected redirect, not found or server error, assume incorrect prod setup
        return false;
      }
      // otherwise assume AEM (e.g. protected)
      return true;
    }
  } catch (e) {
    // unable to connect, assume AEM (e.g. firewalled)
    return true;
  }
}

/**
 * Updates a project based on the given message and sender.
 * @param {chrome.tabs.Tab} _ The tab
 * @param {Object} message The message object
 */
async function updateProject(_, { config }) {
  if (!config?.owner || !config?.repo) {
    return;
  }

  // only update if project exists and has different properties
  const existingProject = await getProject(config);
  if (existingProject) {
    const hasChanges = Object.keys(config)
      .filter((key) => key !== 'owner' && key !== 'repo')
      .some((key) => config[key] !== existingProject[key]);

    if (hasChanges) {
      await updateProjectConfig(config);
    }
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
  getProfilePicture,
  guessAEMSite,
  updateProject,
};

/**
 * Actions which can be executed via external messaging API.
 * @type {Object} The external actions
 */
export const externalActions = {
  updateAuthToken,
  getAuthInfo,
  getSites,
  launch,
};
