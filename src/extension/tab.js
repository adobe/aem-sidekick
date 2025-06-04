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
import {
  getProjects,
  getProjectMatches,
  getProjectFromUrl,
} from './project.js';
import { isSharePointHost, urlCache } from './url-cache.js';
import { updateUI } from './ui.js';
import { getConfig } from './config.js';

/**
 * Loads the content script in the tab.
 * @param {number} tabId The ID of the tab
 * @param {Object[]} matches The config matches
 * @param {string} [adminVersion] The admin version
 */
async function injectContentScript(tabId, matches, adminVersion) {
  // execute content script
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['./content.js'],
    });
    await chrome.tabs.sendMessage(tabId, {
      configMatches: matches,
      adminVersion,
    });
  } catch (e) {
    log.warn('injectContentScript: unable to inject content script', tabId, e);
  }
}

export async function injectSharePointListener(id, tabUrl) {
  chrome.scripting.executeScript({
    target: {
      tabId: id,
      allFrames: true,
    },
    func: (extensionId, origin) => {
      if (window.location.origin === 'https://word-edit.officeapps.live.com' && !window.hlx?.previewListenerAdded) {
        window.hlx = window.hlx || {
          previewListenerAdded: true,
        };
        chrome.runtime.onMessage.addListener(({ action, url }, { id: senderId }, sendResponse) => {
          if (action === 'saveDocument'
            && url.startsWith(origin)
            && senderId === extensionId) {
            const res = document.dispatchEvent(new KeyboardEvent('keydown', {
              key: 's', keyCode: 83, code: 'KeyS', composed: true, metaKey: true,
            }));
            sendResponse(res);
            return res;
          }
          sendResponse(false);
          return false;
        });
      }
    },
    args: [chrome.runtime.id, new URL(tabUrl).origin],
    injectImmediately: true,
  });
}

/**
 * Checks a tab and loads the sidekick when appropriate.
 * @param {number} id The tab ID
 * @returns {Promise<void>}
 */
export async function checkTab(id) {
  try {
    const projects = await getProjects();
    const tab = await chrome.tabs.get(id);
    if (!tab || !tab.url) {
      updateUI();
      return;
    }

    const { url } = tab;

    // fill url cache
    await urlCache.set(tab, projects);

    const matches = await getProjectMatches(projects, tab);
    const config = matches.length === 1 ? matches[0] : await getProjectFromUrl(tab);
    const adminVersion = await getConfig('session', 'adminVersion');

    injectContentScript(id, matches, adminVersion);

    updateUI({
      id, url, config, matches,
    });

    if (isSharePointHost(tab.url, projects)) {
      injectSharePointListener(id, tab.url);
    }
  } catch (e) {
    log.warn(`checkTab: error checking tab ${id}`, e);
  }
}

/**
 * Get the current tab from a background script
 * @returns {Promise<chrome.tabs.Tab>} The current tab
 */
export async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}
