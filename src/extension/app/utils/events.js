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

import sampleRUM from './rum.js';

/**
 * Fires an event with the given name.
 * @private
 * @param {Sidekick} sk The sidekick
 * @param {string} name The name of the event
 * @param {Object} data The data to pass to event listeners (optional)
 */
export function fireEvent(sk, name, data) {
  try {
    const { config, location, status } = sk;
    data = data || {
      // turn complex into simple objects for event listener
      config: JSON.parse(JSON.stringify(config)),
      location: {
        hash: location.hash,
        host: location.host,
        hostname: location.hostname,
        href: location.href,
        origin: location.origin,
        pathname: location.pathname,
        port: location.port,
        protocol: location.protocol,
        search: location.search,
      },
      status,
    };
    sk.dispatchEvent(new CustomEvent(name, {
      detail: { data },
    }));
    const userEvents = [
      'shown',
      'hidden',
      'updated',
      'previewed',
      'published',
      'unpublished',
      'deleted',
      'envswitched',
      'loggedin',
      'loggedout',
      'helpnext',
      'helpdismissed',
      'helpacknowlegded',
      'helpoptedout',
    ];
    if (name.startsWith('custom:') || userEvents.includes(name)) {
      sampleRUM(`sidekick:${name}`, {
        source: data?.sourceUrl || sk.location.href,
        target: data?.targetUrl || sk.status.webPath,
      });
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('failed to fire event', name, e);
  }
}
