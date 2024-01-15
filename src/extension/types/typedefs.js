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

/* eslint-disable max-len */

/**
 * @typedef {Object} ServerConfig
 * @prop {string} contentSourceUrl The content source URL
 * @prop {string} [preview.host] The host name of a custom preview CDN
 * @prop {string} [live.host] The host name of a custom live CDN
 * @prop {string} [prod.host] The production host name to publish content to
 * @description Represents the sidekick configuration from the server-side configuration (`env.json`)
 */

/**
 * @private
 * @typedef {Object} ServerDerivedConfig
 * @prop {string[]} mountpoints The content source URL
 * @prop {string} [previewHost] The host name of a custom preview CDN
 * @prop {string} [liveHost] The host name of a custom live CDN
 * @prop {string} [host] The production host name to publish content to
 * @description The derived sidekick configuration from the from the server-side configuration
 */

/**
 * @typedef {Object} OptionsConfig
 * @prop {string} [project] The name of the project
 * @prop {string} giturl The url to the repository
 * @prop {string} mountpoint The content source URL
 * @prop {string} [previewHost] The host name of a custom preview CDN
 * @prop {string} [liveHost] The host name of a custom live CDN
 * @prop {string} [host] The production host name to publish content to
 * @prop {boolean} [devMode] Loads client configuration and plugins from the development environment
 * @prop {string} [devOrigin] The origin of the local development environment
 * @prop {string} [adminVersion] The specific version of admin service to use
 * @prop {boolean} [disabled] Is the project disabled?
 * @description Represents the sidekick configuration from the user via the options view
 */

/**
 * @private
 * @typedef {Object} OptionsDerivedConfig
 * @prop {string[]} mountpoints The content source URL
 * @prop {string} owner The GitHub owner or organization
 * @prop {string} repo The GitHub repo
 * @prop {string} ref The Git reference or branch
 * @description The derived sidekick configuration from options.
 */

/**
 * @typedef {ServerDerivedConfig & OptionsConfig & OptionsDerivedConfig } SidekickOptionsConfig
 */

/**
 * @typedef {Object} ClientConfig
 * @prop {string} [extends] Extend another project's sidekick configuration?
 * @prop {string} [redirect] Loads the sidekick configuration from a different URL?
 * @prop {string} [project] The name of the project
 * @prop {string} [previewHost] The host name of a custom preview CDN
 * @prop {string} [liveHost] The host name of a custom live CDN
 * @prop {string} [host] The production host name to publish content to
 * @prop {Plugin[]} [plugins] An array of {@link Plugin|plugin configurations}
 * @prop {ViewConfig[]} [specialViews] An array of custom {@link ViewConfig|view configurations}
 * @description The configuration file from the project's respository (`config.json`).
 * @link https://github.com/adobe/helix-sidekick-extension/blob/main/docs/config.schema.json
 */

/**
 * @private
 * @typedef {Object} SidekickDerivedConfig
 * @prop {string} innerHost The host name of the preview origin (standard or custom)
 * @prop {string} stdInnerHost The standard host name of the preview origin
 * @prop {string} outerHost The host name of the live origin (standard or custom)
 * @prop {string} stdOuterHost The standard host name of the live origin
 * @prop {string} devUrl The URL of the local development environment
 * @prop {string} [lang] The UI language to use
 * @prop {ViewConfig[]} [views] An array of custom {@link ViewConfig|view configurations}
 * @description The derived sidekick configuration after loadContext.
 */

/**
 * @typedef {SidekickOptionsConfig & ClientConfig & SidekickDerivedConfig} SidekickConfig
 */

/**
 * @typedef {Object} Plugin
 * @prop {string} id The plugin ID (mandatory)
 * @prop {string} title The button text
 * @prop {Object} [titleI18n] A map of translated button texts (default: {})
 * @prop {string} [url] The URL to open when the button is clicked
 * @prop {boolean} [passConfig] Append additional sk info to the url as query parameters: ref, repo, owner, host, project
 * @prop {boolean} [passReferrer] Append the referrer URL as a query param on new URL button click. Note: Plugin events get a custom: prefix, e.g. "foo" becomes "custom:foo".
 * @prop {string} [containerId] The ID of a dropdown to add this plugin to (optional)
 * @prop {boolean} [isContainer] Determines whether to turn this plugin into a dropdown
 * @prop {boolean} [isPalette] Determines whether a URL is opened in a palette instead of a new tab
 * @prop {string} [paletteRect] The dimensions and position of a palette (optional)
 * @prop {string[]} [environments] Specifies when to show this plugin (admin, edit, dev, preview, live, prod)
 * @prop {string[]} [excludePaths] Exclude the plugin from these paths (glob patterns supported)
 * @prop {string[]} [includePaths] Include the plugin on these paths (glob patterns supported)
 * @description The plugin configuration.
 */

/**
 * @typedef {Object} ViewConfig
 * @prop {string} [id] The unique view ID
 * @prop {string} path The path or globbing pattern where to apply this view
 * @prop {string} viewer The URL to render this view
 * @prop {string | function} [title] The title of the view
 * @description A custom view configuration.
 */

/**
 * @typedef {Object} Modal
 * @prop {string} type The modal type
 * @prop {ModalData} [data] The modal data
 */

/**
 * @typedef {Object} ModalData
 * @prop {string} [message] The modal message
 */

/**
 * @typedef {Object} Toast
 * @prop {string} message The toast message
 * @prop {string} variant The toast variant
 * @prop {string} timeout The time the toast is shown (default: 2000)
 */

export const Types = {};
