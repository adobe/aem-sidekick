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

import {
  toggleDisplay,
} from './display.js';
import checkTab from './tab.js';
import {
  externalActions,
  internalActions,
} from './actions.js';
import { addAuthTokenHeaders } from './auth.js';

chrome.action.onClicked.addListener(async ({ id }) => {
  // toggle the sidekick when the action is clicked
  const display = await toggleDisplay();
  // eslint-disable-next-line no-console
  console.log(`sidekick is now ${display ? 'shown' : 'hidden'}`);
  checkTab(id);
});

chrome.tabs.onUpdated.addListener(async (id, info, tab) => {
  if (tab.active && info.status === 'complete') {
    checkTab(id);
  }
});

chrome.tabs.onActivated.addListener(({ tabId: id }) => {
  checkTab(id);
});

// external messaging API to execute actions
chrome.runtime.onMessageExternal.addListener(async (message, sender, sendResponse) => {
  const { action } = message;
  let resp = null;
  if (typeof externalActions[action] === 'function') {
    resp = await externalActions[action](message, sender);
  }
  sendResponse(resp);
});

// internal messaging API to execute actions
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  const { action: actionFromTab } = message;
  const { tab } = sender;
  let resp = null;
  // check if message contains action and is sent from tab
  if (tab && tab.url && typeof internalActions[actionFromTab] === 'function') {
    resp = await internalActions[actionFromTab](message, sender);
  }
  sendResponse(resp);
});

// add existing auth token headers
addAuthTokenHeaders();

// eslint-disable-next-line no-console
console.log('sidekick initialized');
