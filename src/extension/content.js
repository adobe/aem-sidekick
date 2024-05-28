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

(async () => {
  // ensure hlx namespace
  window.hlx = window.hlx || {};

  const { getDisplay, toggleDisplay } = await import('./display.js');
  const display = await getDisplay();
  let sidekick = document.querySelector('aem-sidekick');

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
        'devOrigin',
        'adminVersion',
        'authTokenExpiry',
        'transient',
      ].includes(k)));
    curatedConfig.scriptUrl = chrome.runtime.getURL('index.js');

    sidekick = new AEMSidekick(curatedConfig);
    sidekick.setAttribute('open', `${display}`);
    document.body.prepend(sidekick);
    window.hlx.sidekick = sidekick;

    sidekick.addEventListener('projectadded', () => {
      chrome.runtime.sendMessage({ action: 'addRemoveProject', url: window.location.href });
    });

    sidekick.addEventListener('hidden', () => {
      toggleDisplay();
      chrome.runtime.sendMessage({ action: 'updateUI' });
    });
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
        window.sessionStorage.setItem('aem-sk-project', JSON.stringify(config));

        loadSidekick(config);

        // remove() doesn't work for custom element
        window.hlx.sidekick.replaceWith('');
        delete window.hlx.sidekick;
      }
    });

    window.hlx.sidekick = configPicker;
  }

  if (!sidekick) {
    // wait for config matches
    chrome.runtime.onMessage.addListener(async (message, { tab }) => {
      // does the message contain config matches?
      if (message.configMatches) {
        const { configMatches } = message;

        // only accept message from background script
        if (tab) {
          return;
        }

        const { sidekick: storedSidekick } = window.hlx;
        if (!storedSidekick) {
        // Load custom element polyfill
          await import('./lib/polyfills.min.js');

          // Check session storage for previously stored project
          const storedProject = JSON.parse(window.sessionStorage.getItem('aem-sk-project') || null);

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
      } else if (message === 'toggleDisplay') {
        sidekick.setAttribute('open', `${await getDisplay()}`);
      }
    });
  } else {
    sidekick.setAttribute('open', `${display}`);
  }
})();
