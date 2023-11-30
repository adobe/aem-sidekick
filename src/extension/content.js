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

(async () => {
  // ensure hlx namespace
  window.hlx = window.hlx || {};

  const { loadScript, getDisplay } = await import('./utils.js');
  const display = await getDisplay();
  let { sidekick } = window.hlx;
  if (!sidekick) {
    // wait for config matches
    chrome.runtime.onMessage.addListener(async ({ configMatches = [] }, { tab }) => {
      // only accept message from background script
      if (tab) {
        return;
      }
      if (configMatches.length === 1) {
        // load sidekick
        const [config] = configMatches;
        // console.log('single match', config);
        await loadScript('index.js');
        sidekick = document.createElement('aem-sidekick');
        sidekick.dataset.config = JSON.stringify(config);
        sidekick.setAttribute('open', display);
        document.body.prepend(sidekick);
        window.hlx.sidekick = sidekick;
      } else {
        // todo: multiple matches, project picker?
        // console.log('multiple matches', configMatches);
      }
    });
  } else {
    sidekick.setAttribute('open', display);
  }
})();
