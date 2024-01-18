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
 * @typedef {import('../store/app.js').AppStore} AppStore
 */

export class CustomPlugin {
  /**
   * @type {string} id The plugin ID (mandatory)
   */
  id;

  /**
   * @type {string} [title] - The button text. Optional.
   */
  title;

  /**
   * @type {Object} A map of translated button texts (default: {})
   */
  titleI18n;

  /**
   * @type {string} The URL to open when the button is clicked
   */
  url;

  /**
   * @type {boolean} Append config to the url as query parameters: ref, repo, owner, host, project
   */
  passConfig;

  /**
   * @type {string} The name of a custom event to fire when the button is clicked (defaults to id)
   */
  event;

  /**
   * @type {boolean} Append the referrer URL as a query param on new URL button click.
   * Note: Plugin events get a custom: prefix, e.g. "foo" becomes "custom:foo".
   */
  passReferrer;

  /**
   * @type {string} The ID of a dropdown to add this plugin to (optional)
   */
  containerId;

  /**
   * @type {boolean} Determines whether to turn this plugin into a dropdown
   */
  isContainer;

  /**
   * @type {boolean} Determines whether a URL is opened in a palette instead of a new tab
   */
  isPalette;

  /**
   * @type {string} The dimensions and position of a palette (optional)
   */
  paletteRect;

  /**
   * @type {string[]} Specifies when to show this plugin (admin, edit, dev, preview, live, prod)
   */
  environments;

  /**
   * @type {string[]} [excludePaths] Exclude the plugin from these paths (glob patterns supported)
   */
  excludePaths;

  /**
   * @type {string[]} [includePaths] Include the plugin on these paths (glob patterns supported)
   */
  includePaths;

  /**
   * Function that checks if the plugin should be displayed
   *
   * @param {AppStore} store - The app store
   */
  condition;

  constructor(data) {
    Object.assign(this, data);
  }
}
