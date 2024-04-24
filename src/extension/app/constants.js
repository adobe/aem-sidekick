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

import { html } from 'lit';

/**
 * Mapping between the plugin IDs that will be treated as environments
 * and their corresponding host properties in the config.
 * @private
 * @type {Object}
 */
export const ENVS = {
  edit: 'edit',
  dev: 'localhost',
  preview: 'innerHost',
  live: 'outerHost',
  prod: 'host',
};

/**
 * Internal event types
 * @enum {string}
 */
export const EVENTS = {
  OPEN_PALETTE: 'open-palette',
  CLOSE_PALETTE: 'close-palette',
};

/**
 * External event types
 * @enum {string}
 */
export const EXTERNAL_EVENTS = {
  CONTEXT_LOADED: 'contextloaded',
  STATUS_FETCHED: 'statusfetched',
  RESOURCE_UPDATED: 'updated',
  RESOURCE_PREVIEWED: 'previewed',
  RESOURCE_DELETED: 'deleted',
  RESOURCE_PUBLISHED: 'published',
  RESOURCE_UNPUBLISHED: 'unpublished',
  EVIRONMENT_SWITCHED: 'envswitched',
  PLUGIN_USED: 'pluginused',
};

/**
 * Modal types
 * @enum {string}
 */
export const MODALS = {
  WAIT: 'wait',
  ERROR: 'error',
  DELETE: 'delete',
};

/**
 * Modal Events
 * @enum {string}
 */
export const MODAL_EVENTS = {
  CLOSE: 'close',
  CANCEL: 'cancel',
  SECONDARY: 'secondary',
  CONFIRM: 'confirm',
};

/**
 * Toast Events
 * @enum {string}
 */
export const TOAST_EVENTS = {
  CLOSE: 'close',
};

/**
 * Array of restricted paths with limited sidekick functionality.
 * @private
 * @type {string[]}
 */
export const RESTRICTED_PATHS = [
  '/helix-env.json',
];

/**
 * The SVG icons.
 * @type {Object<string, import("lit").TemplateResult>}
 */
export const ICONS = {
  ADOBE_LOGO: html`
    <svg width="250" height="245" viewBox="0 0 250 245" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M47.5 3H202.5C226 3 245 22 245 45.5V194.5C245 218 226 237 202.5 237H47.5C24 237 5 218 5 194.5V45.5C5 22 24 3 47.5 3Z" fill="black"/>
      <path d="M192 179H163C160.3 179.2 157.9 177.5 157 175L126 103C126 102.4 125.6 102 125 102C124.4 102 124 102.4 124 103L104 149C104 150.1 104.9 151 106 151H127C128.3 150.9 129.6 151.7 130 153L139 174C139.6 176.1 138.4 178.3 136.2 178.9C136.1 178.9 136 178.9 136 179H59C56.8 178.5 55.5 176.4 55.9 174.2C55.9 174.1 55.9 174 56 174L105 57C106.1 54.7 108.4 53.1 111 53H139C141.6 53.1 143.9 54.7 145 57L195 174C195.6 176.1 194.4 178.3 192.2 178.9C192.2 179 192.1 179 192 179Z" fill="#FA0F00"/>
    </svg>`,
  PROPERTIES: html`
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1.5749 6.09414H3.97673C4.28331 7.3813 5.43588 8.34414 6.81538 8.34414C8.19487 8.34414 9.34746 7.3813 9.65402 6.09414H16.4249C16.7975 6.09414 17.0999 5.79179 17.0999 5.41914C17.0999 5.04649 16.7975 4.74414 16.4249 4.74414H9.65402C9.34745 3.45698 8.19487 2.49414 6.81538 2.49414C5.43588 2.49414 4.2833 3.45698 3.97673 4.74414H1.5749C1.20225 4.74414 0.899902 5.04649 0.899902 5.41914C0.899902 5.79179 1.20225 6.09414 1.5749 6.09414ZM6.81538 3.84414C7.68373 3.84414 8.39038 4.55078 8.39038 5.41914C8.39038 6.2875 7.68373 6.99414 6.81538 6.99414C5.94702 6.99414 5.24038 6.2875 5.24038 5.41914C5.24038 4.55078 5.94702 3.84414 6.81538 3.84414Z" fill="currentColor"/>
      <path d="M16.4249 11.9443H14.154C13.8475 10.6572 12.6949 9.69434 11.3154 9.69434C9.93589 9.69434 8.78331 10.6572 8.47674 11.9443H1.5749C1.20225 11.9443 0.899902 12.2467 0.899902 12.6193C0.899902 12.992 1.20225 13.2943 1.5749 13.2943H8.47673C8.78331 14.5815 9.93588 15.5443 11.3154 15.5443C12.6949 15.5443 13.8475 14.5815 14.154 13.2943H16.4249C16.7975 13.2943 17.0999 12.992 17.0999 12.6193C17.0999 12.2467 16.7976 11.9443 16.4249 11.9443ZM11.3154 14.1943C10.447 14.1943 9.74038 13.4877 9.74038 12.6193C9.74038 11.751 10.447 11.0443 11.3154 11.0443C12.1837 11.0443 12.8904 11.751 12.8904 12.6193C12.8904 13.4877 12.1837 14.1943 11.3154 14.1943Z" fill="currentColor"/>
    </svg>`,
};
