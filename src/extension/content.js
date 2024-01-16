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
 * The modal type
 * @typedef {import('@Types').OptionsConfig} OptionsConfig
 */
import { log } from './log.js';

(async () => {
  // ensure hlx namespace
  window.hlx = window.hlx || {};

  const { getDisplay } = await import('./display.js');
  const display = await getDisplay();
  let { sidekick } = window.hlx;

  /**
   * Load the sidekick custom element and add it to the DOM
   * @param {OptionsConfig} config The config to load the sidekick with
   */
  async function loadSidekick(config) {
    const { AEMSidekick } = await import('./index.js');

    // reduce config to only include properties relevant for sidekick
    const curatedConfig = Object.fromEntries(Object.entries(config)
      .filter(([k]) => [
        'owner',
        'repo',
        'ref',
        'previewHost',
        'liveHost',
        'host',
        'devMode',
        'devOrigin',
        'adminVersion',
        'authTokenExpiry',
        'hlx5',
      ].includes(k)));
    curatedConfig.scriptUrl = chrome.runtime.getURL('index.js');

    sidekick = new AEMSidekick(curatedConfig);
    sidekick.setAttribute('open', display);
    document.body.prepend(sidekick);
    window.hlx.sidekick = sidekick;
  }

  /**
   * Load the config picker custom element and add it to the DOM
   * @param {OptionsConfig[]} configMatches The config matches to pick from
   */
  async function loadConfigPicker(configMatches) {
    const { AEMConfigPicker } = await import('./index.js');
    const configPicker = new AEMConfigPicker(configMatches);
    configPicker.setAttribute('open', display ? display.toString() : 'false');
    document.body.prepend(configPicker);

    configPicker.addEventListener('configselected', (event) => {
      if (event instanceof CustomEvent) {
        const { config } = event.detail;

        // Store the selected config in session storage
        window.sessionStorage.setItem('hlx-sk-project', JSON.stringify(config));

        loadSidekick(config);

        // remove() doesn't work for custom element
        window.hlx.sidekick.replaceWith('');
        delete window.hlx.sidekick;
      }
    });

    window.hlx.sidekick = configPicker;
  }

  // Only setup listener if sidekick is not already loaded
  let sidekick = document.querySelector('aem-sidekick');
  if (!sidekick) {
    // wait for config matches
    chrome.runtime.onMessage.addListener(async ({ configMatches = [] }, { tab }) => {
      // only accept message from background script
      if (tab) {
        return;
      }

      const { sidekick: storedSidekick } = window.hlx;
      if (!storedSidekick) {
        // Load custom element polyfill
        await import('./lib/polyfills.min.js');

        // Check session storage for previously stored project
        const storedProject = JSON.parse(window.sessionStorage.getItem('hlx-sk-project') || null);

        // First check if there is only one config match, if so load it
        if (configMatches.length === 1) {
          // load sidekick
          const [config] = configMatches;
          loadSidekick(config);
        // If there is more than one config match, check if we previously stored a project
        } else if (storedProject) {
          loadSidekick(storedProject);
        } else {
          loadConfigPicker(configMatches);
        }
      }
    });
  } else {
    sidekick.setAttribute('open', `${display}`);
  }
})();
