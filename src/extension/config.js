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

/**
 * Retrieves a configuration from a given storage area.
 * @param {string} area The storage type
 * @param {string} prop The property name
 * @returns {Promise<*>} The configuration
 */
export async function getConfig(area, prop) {
  const cfg = await chrome.storage[area].get(prop);
  return cfg?.[prop];
}

/**
 * Changes a configuration in a given storage area.
 * @param {string} area The storage type
 * @param {Object} obj The configuration object with the property/properties to change
 * @returns {Promise<void>}
 */
export async function setConfig(area, obj) {
  return chrome.storage[area].set(obj);
}

/**
 * Removes a configuration from a given storage area.
 * @param {string} area The storage type
 * @param {string} prop The property name
 * @returns {Promise<void>}
 */
export async function removeConfig(area, prop) {
  return chrome.storage[area].remove(prop);
}

/**
 * Removes all configurations from a given storage area.
 * @param {string} area The storage type
 * @returns {Promise<void>}
 */
export async function clearConfig(area) {
  return chrome.storage[area].clear();
}
