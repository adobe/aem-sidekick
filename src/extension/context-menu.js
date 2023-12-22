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

import { internalActions } from './actions.js';
import { GH_URL, getProject } from './project.js';

/**
 * @private
 * @type {boolean}
 * @description <code>true</code> if the context menu is currently being updated,
 * else <code>false</code>
 */
let updateInProgress = false;

/**
 * @typedef {Object} Context
 * @prop {Object} config The project config
 * @prop {string} url The URL
 * @prop {number} id The tab ID
 * @description The context object
 */

/**
 * Updates context menu items.
 * @param {Context} context The context object
 */
export async function updateContextMenu({
  url, config,
}) {
  if (chrome.contextMenus && !updateInProgress) {
    updateInProgress = true;
    // clear context menu
    await chrome.contextMenus.removeAll();

    const { owner, repo } = config || {};
    if (owner && repo) {
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
        // open preview url
        await chrome.contextMenus.create({
          id: 'openPreview',
          title: chrome.i18n.getMessage('open_preview'),
          contexts: [
            'action',
          ],
          visible: url.startsWith(GH_URL),
        });
      }
    }
    // open view doc source
    // if (await guessAEMSite(id)) {
    //   // todo: implement view doc source
    //   await chrome.contextMenus.create({
    //     id: 'openViewDocSource',
    //     title: chrome.i18n.getMessage('open_view_doc_source'),
    //     contexts: [
    //       'action',
    //     ],
    //   });
    // }
    updateInProgress = false;
  }
}

// add listener for clicks on context menu item
if (chrome.contextMenus) {
  chrome.contextMenus.onClicked.addListener(async ({ menuItemId }, tab) => {
    internalActions[menuItemId](tab);
  });
}
