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
  OPEN_MODAL: 'open-modal',
  CLOSE_MODAL: 'close-modal',
  SHOW_TOAST: 'show-toast',
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
};
