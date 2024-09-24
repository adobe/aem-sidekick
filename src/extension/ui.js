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
import { internalActions } from './actions.js';
import { getDisplay } from './display.js';
import {
  GH_URL,
  detectLegacySidekick,
  getProject,
  isValidProject,
} from './project.js';

/**
 * The configuration object type
 * @typedef {import('@Types').OptionsDerivedConfig} OptionsDerivedConfig
 */

/**
 * @typedef {Object} Context
 * @prop {number} [id] The tab ID
 * @prop {string} [url] The tab URL
 * @prop {Object} [config] The project config
 * @prop {OptionsDerivedConfig[]} [matches] The config matches
 * @description The context object
 */

/**
 * @type {number[]} The supported icon sizes
 */
const ICON_SIZES = [16, 32, 48, 128, 512];

/**
 * @private
 * @type {boolean}
 * @description true if context menu is currently being updated, else false
 */
let updateInProgress = false;

/**
 * Returns an icon path object.
 * @param {string} type The icon type
 * @returns {Object<number, string>} The icon paths
 */
function getPaths(type) {
  const paths = {};
  for (const size of ICON_SIZES) {
    paths[size] = `icons/${type}/icon-${size}x${size}.png`;
  }
  // @ts-ignore
  return paths;
}

/**
 * Updates the extension icon.
 * @param {Context} context The context object
 */
export async function updateIcon({ matches = [] }) {
  let iconType = 'disabled';
  if (matches.length > 0 && isValidProject(matches[0])) {
    if (await getDisplay()) {
      iconType = 'default';
    } else {
      iconType = 'hidden';
    }
  }
  // update icon
  log.debug(`updateIcon: using icon type ${iconType}`);
  await chrome.action.setIcon({
    path: getPaths(iconType),
  });
}

/**
 * Tries to guess if the current tab contains an AEM site.
 * @param {number} id The tab ID
 * @returns {Promise<boolean>} True if the provided tab contains an AEM site
 */
async function guessAEMSite(id) {
  return new Promise((resolve) => {
    try {
      chrome.scripting.executeScript({
        target: { tabId: id },
        func: () => {
          const isAEM = document.body.querySelector(':scope > main > div') !== null;
          chrome.runtime.sendMessage({ isAEM });
        },
      });
      // listen for response message from tab
      const listener = ({ isAEM }) => {
        chrome.runtime.onMessage.removeListener(listener);
        resolve(!!isAEM);
      };
      chrome.runtime.onMessage.addListener(listener);
    } catch (e) {
      log.debug('Error guessing AEM site', e);
      resolve(false);
    }
  });
}

/**
 * Updates context menu items.
 * @param {Context} context The context object
 */
export async function updateContextMenu({
  id, url, config,
}) {
  if (chrome.contextMenus && !updateInProgress) {
    updateInProgress = true;
    // clear context menu
    await chrome.contextMenus.removeAll();

    if (isValidProject(config) && !url.startsWith(GH_URL)) {
      const { owner, repo } = config;
      const project = await getProject(`${owner}/${repo}`);
      // add/remove project config
      await chrome.contextMenus.create({
        id: 'addRemoveProject',
        title: chrome.i18n.getMessage(project
          ? 'config_project_remove'
          : 'config_project_add'),
        contexts: [
          'action',
        ],
      });
      if (project) {
        const { disabled } = project;
        // enable/disable project config
        await chrome.contextMenus.create({
          id: 'enableDisableProject',
          title: chrome.i18n.getMessage(disabled
            ? 'config_project_enable'
            : 'config_project_disable'),
          contexts: [
            'action',
          ],
        });
      }
      // open view doc source
      if (await guessAEMSite(id)) {
        await chrome.contextMenus.create({
          id: 'openViewDocSource',
          title: chrome.i18n.getMessage('open_view_doc_source'),
          contexts: [
            'action',
          ],
        });
      }
    }
    if (await detectLegacySidekick()) {
      // import legacy projects
      await chrome.contextMenus.create({
        id: 'separator',
        type: 'separator',
        contexts: [
          'action',
        ],
      });
      await chrome.contextMenus.create({
        id: 'importProjects',
        title: chrome.i18n.getMessage('config_project_import'),
        contexts: [
          'action',
        ],
      });
    }
    updateInProgress = false;
  }
}

/**
 * Updates the extension UI based on the context.
 * @param {Context} context The context object
 */
export async function updateUI(context = {}) {
  await updateContextMenu(context);
  await updateIcon(context);
}

// add listener for clicks on context menu item
if (chrome.contextMenus) {
  chrome.contextMenus.onClicked.addListener(async ({ menuItemId }, tab) => {
    if (!tab.url) return;
    internalActions[menuItemId](tab);
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: async (menuItemIdVal) => {
        try {
          const mod = await import(chrome.runtime.getURL('utils/rum.js'));
          const { default: sampleRUM } = mod;

          // Ensure window.hlx and window.hlx.sidekick exists
          window.hlx = window.hlx || {};
          window.hlx.sidekick = window.hlx.sidekick || { location: window.location };

          // @ts-ignore
          const action = `${menuItemIdVal}`.replaceAll(/([A-Z])/g, `-${'$1'}`).toLowerCase();
          sampleRUM('click', {
            source: 'sidekick',
            target: `context-menu:${action}`,
          });
        } catch (e) {
          // eslint-disable-next-line no-console
          console.log('Unable to collect RUM data', e);
        }
      },
      args: [menuItemId],
    });
  });
}
