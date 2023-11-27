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

export const DEV_URL = 'http://localhost:3000';
export const GH_URL = 'https://github.com/';

/**
 * Loads a script as a module via <code>script</code> element in the
 * document's <code>head</code> element.
 * @param {string} path The script path
 */
export async function loadScript(path) {
  return new Promise((resolve) => {
    const src = chrome.runtime.getURL(path);
    if (!document.querySelector(`script[src="${src}"]`)) {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = src;
      script.onload = () => resolve();
      document.head.appendChild(script);
    }
  });
}

/**
 * Checks if a host is a valid project host.
 * @private
 * @param {string} host The base host
 * @param {string} owner The owner
 * @param {string} host The repo
 * @returns {boolean} <code>true</code> if project host, else <code>false</code>
 */
export function isValidProjectHost(host, owner, repo) {
  const [third, second, first] = host.split('.');
  return host.endsWith(first)
    && ['page', 'live'].includes(first)
    && ['aem', 'hlx'].includes(second)
    && third.endsWith(`--${repo}--${owner}`);
}

/**
 * Returns matches from configured projects for a given tab URL.
 * @param {Object[]} configs The project configurations
 * @param {string} tabUrl The tab URL
 * @returns {Promise<Object[]>} The matches
 */
export async function getConfigMatches(configs, tabUrl) {
  const {
    host: checkHost,
  } = new URL(tabUrl);
  // exclude disabled configs
  configs = configs.filter((cfg) => !cfg.disabled);
  const matches = configs.filter((cfg) => {
    const {
      owner,
      repo,
      host: prodHost,
      previewHost,
      liveHost,
    } = cfg;
    return checkHost === prodHost // production host
      || checkHost === previewHost // custom inner
      || checkHost === liveHost // custom outer
      || isValidProjectHost(checkHost, owner, repo); // inner or outer
  });
  // todo: check url cache if no matches
  return matches;
}

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

/**
 * Returns the display status.
 * @returns {Promise<boolean>} The current display status
 */
export async function getDisplay() {
  const display = await getConfig('local', 'hlxSidekickDisplay') || false;
  return display;
}

/**
 * Sets the display status.
 * @param {boolean} display <code>true</code> if sidekick should be shown, else <code>false</code>
 * @returns {Promise<boolean>} The new display status
 */
export async function setDisplay(display) {
  await setConfig('local', {
    hlxSidekickDisplay: display,
  });
  return display;
}

/**
 * Toggles the display status.
 * @returns {Promise<boolean>} The new display status
 */
export async function toggleDisplay() {
  const display = await getDisplay();
  // console.log(`toggleDisplay from ${display} to ${!display}`);
  return setDisplay(!display);
}

/**
 * Extracts settings from a GitHub URL.
 * @param {string} giturl The GitHub URL
 * @returns {Objct} The GitHub settings
 */
export function getGitHubSettings(giturl) {
  if (typeof giturl === 'string' && giturl.startsWith(GH_URL)) {
    const [owner, repository,, ref = 'main'] = new URL(giturl).pathname.toLowerCase()
      .substring(1).split('/');
    if (owner && repository) {
      const repo = repository.endsWith('.git') ? repository.split('.git')[0] : repository;
      return {
        owner,
        repo,
        ref,
      };
    }
  }
  return {};
}
