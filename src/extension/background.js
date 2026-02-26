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
  toggleDisplay,
} from './display.js';
import { checkTab, getCurrentTab } from './tab.js';
import {
  externalActions,
  internalActions,
  checkViewDocSource,
} from './actions.js';
import { configureAuthAndCorsHeaders, updateUserAgent } from './auth.js';

chrome.action.onClicked.addListener(async () => {
  // toggle the sidekick when the action is clicked
  const display = await toggleDisplay();
  log.info(`sidekick is now ${display ? 'shown' : 'hidden'}`);
});

chrome.tabs.onUpdated.addListener(async (id, info, tab) => {
  if (tab.active && info.status === 'complete') {
    checkTab(id);
    checkViewDocSource(id);
  }
});

chrome.tabs.onActivated.addListener(({ tabId: id }) => {
  checkTab(id);
});

// internal messaging API to execute actions
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { action: actionFromTab } = message;
  const { tab } = sender;

  // check if message contains action and is sent from tab
  if (tab && tab.url && typeof internalActions[actionFromTab] === 'function') {
    internalActions[actionFromTab](tab, message)
      .then((response) => sendResponse(response))
      .catch(() => sendResponse(null));
    return true;
  }

  sendResponse(null);
  return false;
});

// external messaging API to execute actions
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  const { action } = message;

  if (typeof externalActions[action] !== 'function') {
    sendResponse(null);
    return false;
  }

  Promise.resolve(externalActions[action](message, sender))
    .then(sendResponse)
    .catch((e) => {
      sendResponse({ error: e.message });
    });

  return true;
});

// Listen for changes in display state in local storage.
// If the state changes we need to call checkTab to update the extension UI.
chrome.storage.onChanged.addListener(async (changes, storageArea) => {
  if (storageArea === 'local' && changes.display) {
    const tab = await getCurrentTab();
    await checkTab(tab.id);
  }
});

// add existing auth token headers
configureAuthAndCorsHeaders();

// update the user agent for requests to the Admin API
updateUserAgent();

log.info('sidekick initialized');
