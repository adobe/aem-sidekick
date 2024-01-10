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

(async () => {
  // ensure hlx namespace
  window.hlx = window.hlx || {};

  const { getDisplay } = await import('./display.js');
  const display = await getDisplay();
  let sidekick = document.querySelector('aem-sidekick');
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
        log.debug('single match', config);

        await import('./lib/polyfills.min.js');

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
        sidekick.setAttribute('open', `${display}`);
        document.body.prepend(sidekick);
        window.hlx.sidekick = sidekick;
      } else {
        // todo: multiple matches, project picker?
        log.debug('multiple matches', configMatches);
      }
    });
  } else {
    sidekick.setAttribute('open', `${display}`);
  }
})();
