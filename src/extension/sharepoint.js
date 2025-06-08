/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/**
 * Helper function to inject into the word editor frame to save the document.
 * @param {string} extensionId The extension ID
 * @param {string} sharePointUrl The SharePoint URL
 * @param {Window} [win] The window object for testing
 */
export async function wordHelper(extensionId, sharePointUrl, win = window) {
  // istanbul ignore next 18
  if (win.location.origin === 'https://word-edit.officeapps.live.com' && !win.hlx?.previewListenerAdded) {
    win.hlx = win.hlx || {};
    win.hlx.previewListenerAdded = true;
    chrome.runtime.onMessage.addListener(({ action, url }, { id: senderId }, sendResponse) => {
      if (action === 'saveDocument'
        && url === sharePointUrl
        && senderId === extensionId) {
        const metaKey = navigator.userAgent.includes('Macintosh');
        document.dispatchEvent(new KeyboardEvent('keydown', {
          key: 's', keyCode: 83, code: 'KeyS', composed: true, metaKey, ctrlKey: !metaKey,
        }));
        sendResponse(true);
        return true;
      }
      sendResponse(false);
      return false;
    });
  }
}

/**
 * Injects a helper function into Word's editor frame to save the document.
 * @param {number} tabId The ID of the tab
 * @param {string} tabUrl The URL of the tab
 */
export async function injectWordHelper(tabId, tabUrl) {
  chrome.scripting.executeScript({
    target: {
      tabId,
      allFrames: true,
    },
    func: wordHelper,
    args: [chrome.runtime.id, tabUrl],
    injectImmediately: true,
  });
}

/**
 * Sends a message to the tab to trigger a save event
 * @param {chrome.tabs.Tab} tab The tab
 * @returns {Promise<boolean>} True if the message was relayed, else false
 */
export async function saveDocument({ id, url }) {
  return chrome.tabs.sendMessage(id, {
    action: 'saveDocument',
    url,
  });
}
