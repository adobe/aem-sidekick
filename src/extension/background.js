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
} from './utils.js';
import checkTab from './check-tab.js';

chrome.action.onClicked.addListener(async ({ id }) => {
  // toggle the sidekick when the action is clicked
  await toggleDisplay();
  checkTab(id);
});

chrome.tabs.onUpdated.addListener(async (id, info) => {
  if (info.status === 'complete') {
    checkTab(id);
  }
});

chrome.tabs.onActivated.addListener(({ tabId: id }) => {
  checkTab(id);
});

// todo: auth header handling

// todo: listen for external messages and implement listeners:
// updateAuthToken, deleteAuthToken, closePalette, loadSidekick
