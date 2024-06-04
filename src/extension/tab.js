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
import { urlCache } from './url-cache.js';
import { updateUI } from './ui.js';
import { getDisplay } from './display.js';

export const DEV_URL = 'http://localhost:3000';

/**
 * Retrieves the proxy URL from a local dev tab.
 * @param {chrome.tabs.Tab} tab The tab
 * @returns {Promise<string>} The proxy URL
 */
async function getProxyUrl({ id, url: tabUrl }) {
  return new Promise((resolve) => {
    // inject proxy url retriever
    chrome.scripting.executeScript({
      target: { tabId: id },
      func: () => {
        let proxyUrl = null;
        const meta = document.head.querySelector('meta[property="hlx:proxyUrl"]');
        if (meta && meta instanceof HTMLMetaElement && meta.content) {
          proxyUrl = meta.content;
        }
        chrome.runtime.sendMessage({ proxyUrl });
      },
    });
    // listen for proxy url from tab
    const listener = ({ proxyUrl: proxyUrlFromTab }, { tab }) => {
      // check if message contains proxy url and is sent from right tab
      if (proxyUrlFromTab && tab && tab.url === tabUrl && tab.id === id) {
        chrome.runtime.onMessage.removeListener(listener);
        resolve(proxyUrlFromTab);
      } else {
        // fall back to tab url
        resolve(tabUrl);
      }
    };
    chrome.runtime.onMessage.addListener(listener);
  });
}

/**
 * Loads the content script in the tab.
 * @param {number} tabId The ID of the tab
 * @param {Object[]} matches The config matches
 */
async function injectContentScript(tabId, matches) {
  // execute content script
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['./content.js'],
    });
    await chrome.tabs.sendMessage(tabId, {
      configMatches: matches,
    });
  } catch (e) {
    log.warn('injectContentScript: unable to inject content script', tabId, e);
  }
}

/**
 * Checks a tab and loads the sidekick when appropriate.
 * @param {number} id The tab ID
 * @returns {Promise<void>}
 */
export default async function checkTab(id) {
  try {
    const projects = await getProjects();
    const tab = await chrome.tabs.get(id);
    if (!tab || !tab.url) {
      updateUI();
      return;
    }

    let { url } = tab;

    // check for dev URL
    const devUrls = [
      DEV_URL,
      ...projects
        .filter((p) => !!p.devOrigin)
        .map((p) => p.devOrigin),
    ];
    if (devUrls.find((devUrl) => url.startsWith(devUrl))) {
      // retrieve proxy url
      url = await getProxyUrl(tab);
    }
    // fill url cache
    await urlCache.set(tab, projects);

    // todo: if share url, inject install helper

    const matches = await getProjectMatches(projects, tab);

    const config = matches.length === 1 ? matches[0] : await getProjectFromUrl(tab);

    const display = await getDisplay();

    // If we found matches and the sidekick is displayed, inject content script
    if (matches.length > 0 && display) {
      // inject content script and send matches to tab
      await injectContentScript(id, matches);
    } else {
      try {
        // The display might have been toggled off, so let the content script know to update
        await chrome.tabs.sendMessage(id, 'toggleDisplay');
      } catch (e) {
        // ignore, content script might not be loaded
      }
    }

    updateUI({
      id, url, config, matches,
    });
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
