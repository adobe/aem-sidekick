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

import { getConfig, setConfig } from './config.js';

/**
 * Returns the display status.
 * @returns {Promise<boolean>} The current display status
 */
export async function getDisplay() {
  const display = await getConfig('local', 'display') || false;
  return display;
}

/**
 * Sets the display status.
 * @param {boolean} display true if sidekick should be shown, false if it should be hidden
 * @returns {Promise<boolean>} The new display status
 */
export async function setDisplay(display) {
  await setConfig('local', {
    display,
  });

  const mod = await import(chrome.runtime.getURL('utils/rum.js'));
  const { default: sampleRUM } = mod;

  sampleRUM('click', {
    source: 'sidekick',
    target: `${display ? 'shown' : 'hidden'}`,
  });
  return display;
}

/**
 * Toggles the display status.
 * @returns {Promise<boolean>} The new display status
 */
export async function toggleDisplay() {
  const display = await getDisplay();
  return setDisplay(!display);
}
