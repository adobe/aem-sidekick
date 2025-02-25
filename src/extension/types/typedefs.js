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
 * @prop {string} contentSourceType The content source type ("onedrive", "google" or "markup")
 * @prop {string} [preview.host] The host name of a custom preview CDN
 * @prop {string} [live.host] The host name of a custom live CDN
 * @prop {string} [prod.host] The production host name to publish content to
 * @description Represents the sidekick configuration from the server-side configuration (`env.json`)
 */

/**
 * @private
 * @typedef {Object} ServerDerivedConfig
 * @prop {string} contentSourceUrl The content source URL
 * @prop {string} contentSourceType The content source type ("onedrive", "google" or "markup")
 * @prop {string[]} [mountpoints] The content source URL (deprecated)
 * @prop {string} [previewHost] The host name of a custom preview CDN
 * @prop {string} [reviewHost] The host name of a custom review CDN
 * @prop {string} [liveHost] The host name of a custom live CDN
 * @prop {string} [host] The production host name to publish content to
 * @description The derived sidekick configuration from the server-side configuration
 */

/**
 * @typedef {Object} OptionsConfig
 * @prop {string} id The id of the config
 * @prop {string} [project] The name of the project
 * @prop {string} [giturl] The url to the repository
 * @prop {string[]} [mountpoints] The content source URL
 * @prop {string} [previewHost] The host name of a custom preview CDN
 * @prop {string} [liveHost] The host name of a custom live CDN
 * @prop {string} [host] The production host name to publish content to
 * @prop {string} [devOrigin] The origin of the local development environment
 * @prop {string} [editUrlLabel] The custom label of the edit content source
 * @prop {string} [editUrlPattern] The pattern of the edit content source
 * @prop {string} [adminVersion] The specific version of admin service to use
 * @prop {boolean} [disabled] Is the project disabled?
 * @description Represents the sidekick configuration from the user via the options view
 */

/**
 * @private
 * @typedef {Object} OptionsDerivedConfig
 * @prop {string[]} [mountpoints] The content source URL
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
 * @typedef {Object} SitePlugin
 * @prop {string} id The plugin ID (mandatory)
 * @prop {string} [title] The button text
 * @prop {Object} [titleI18n] A map of translated button texts (default: {})
 * @prop {string} [event] The name of a custom event to fire when the button is clicked (defaults to id)
 * @prop {string} [url] The URL to open when the button is clicked
 * @prop {boolean} [passConfig] Append additional sk info to the url as query parameters: ref, repo, owner, host, project
 * @prop {boolean} [passReferrer] Append the referrer URL as a query param on new URL button click. Note: Plugin events get a custom: prefix, e.g. "foo" becomes "custom:foo".
 * @prop {string} [containerId] The ID of a dropdown to add this plugin to (optional)
 * @prop {boolean} [isContainer] Determines whether to turn this plugin into a dropdown
 * @prop {boolean} [isPalette] Determines whether a URL is opened in a palette instead of a new tab
 * @prop {string} [paletteRect] The dimensions and position of a palette (optional)
 * @prop {boolean} [isPopover] Determines whether a URL is opened in a popover instead of a new tab
 * @prop {string} [popoverRect] The dimensions of a popover (optional)
 * @prop {boolean} [isBadge] Determines whether the plugin is a badge (optional)
 * @prop {string} [badgeVariant] The color variant of the badge (optional)
 * @prop {string[]} [environments] Specifies when to show this plugin (admin, edit, dev, preview, live, prod)
 * @prop {string[]} [excludePaths] Exclude the plugin from these paths (glob patterns supported)
 * @prop {string[]} [includePaths] Include the plugin on these paths (glob patterns supported)
 * @description The custom plugin configuration.
 */

/**
 * @typedef {Object} CorePlugin
 * @prop {string} id The plugin ID (mandatory)
 * @prop {PluginButton} [button] A button configuration object (optional)
 * @prop {string} [container] The ID of a dropdown to add this plugin to (optional)
 * @prop {Function} [condition] Show this plugin (optional).
 * @prop {boolean} [pinned=true] Pin this plugin to the action bar (optional).
 * @prop {boolean} [confirm=false] Requires confirmation before action is executed (optional).
 * This function is expected to return a boolean when called with the sidekick as argument.
 * @prop {Function} [callback] A function called after adding the plugin (optional).
 * This function is called with the sidekick and the newly added plugin as arguments.
 * @description The internal plugin configuration.
 */

/**
 * @typedef {SitePlugin & CorePlugin } CustomPlugin
 */

/**
 * @typedef {Object} ElemConfig
 * @private
 * @prop {string} tag The tag name (mandatory)
 * @prop {string} text The text content (optional)
 * @prop {Object[]} attrs The attributes (optional)
 * @prop {Object[]} lstnrs The event listeners (optional)
 * @description The configuration of an element to add.
 */

/**
 * @typedef {Object} PluginButton
 * @prop {string} text The button text
 * @prop {Function} action The click listener
 * @prop {Function} [isPressed] Determines whether the button is pressed. Default false.
 * @prop {Function} [isEnabled] Determines whether to enable the button. Default true.
 * @prop {boolean} [isDropdown] Determines whether to turn this button into a dropdown. Default false.
 * @description The configuration for a plugin button. This can be used as
 * a shorthand for {@link elemConfig}.
 */

/**
 * @typedef {Object} ViewConfig
 * @prop {string} [id] The unique view ID
 * @prop {string} path The path or globbing pattern where to apply this view
 * @prop {string} viewer The URL to render this view
 * @prop {string | Function} [title] The title of the view
 * @description A custom view configuration.
 */

/**
 * @typedef {Object} Modal
 * @prop {string} type The modal type
 * @prop {ModalData} [data] The modal data
 */

/**
 * @typedef {Object} ModalData
 * @prop {string} [headline] The modal headline
 * @prop {string} [message] The modal message
 * @prop {string} [confirmLabel] The confirm button label
 * @prop {Function} [confirmCallback] The function to call on confirm
 * @prop {string} [secondaryLabel] The secondary button label
 * @prop {Function} [secondaryCallback] The function to call on secondary action
 * @prop {string} [cancelLabel] The cancel button label
 * @prop {string} [action] The action type (delete or unpublish)
 */

/**
 * @typedef {Object} Toast
 * @prop {string} message The toast message
 * @prop {string} [variant] The toast variant
 * @prop {Function} [closeCallback] The function to call on close
 * @prop {Function} [actionCallback] The function to call on action
 * @prop {string} [actionLabel] The action label
 * @prop {Function} [secondaryCallback] The function to call on secondary action
 * @prop {string} [secondaryLabel] The secondary actiom label
 * @prop {number} [timeout] The time the toast is shown (default: 3000)
 * @prop {Function} [timeoutCallback] The function to call on timeout
 */

/**
 * @typedef {Object} BulkResource
 * @property {string} type The file type
 * @property {string} file The file name
 * @property {string} [path] The file path
 */

/**
 * @typedef {BulkResource[]} BulkSelection
 */

/**
 * @typedef {Object} BulkSummary
 * @property {string} operation The bulk operation
 * @property {string} host The host name for URLs
 * @property {AdminJobResource[]} resources The resource details
 */

/**
 * @typedef {Object} AdminJobResource
 * @property {string} path The resource path
 * @property {number} status The status code
 * @property {string} [error] The error message
 * @property {string} [errorCode] The error code
 */

/**
 * @typedef {Object} AdminJobProgress
 * @property {number} failed The number of failed operations
 * @property {number} processed The number of processed resources
 * @property {number} total The total number of resources
 */

/**
 * @typedef {Object} AdminJob
 * @property {string} name The job name
 * @property {string} state The job state
 * @property {AdminJobProgress} progress The progress info
 * @property {string} startTime The job start time as UTC string
 * @property {string} [stopTime] The job stop time as UTC string
 * @property {Object} [data] The job data
 * @property {AdminJobResource[]} [data.resources] The resources
 */

/**
 * @typedef {Object} AdminResponse
 * @property {boolean} ok Is the response ok?
 * @property {number} status The HTTP status code
 * @property {Headers} [headers] The response headers
 * @property {string} [error] The error message
 * @property {string} [path] The path of the response
 */

/**
 * @typedef {Object} OnboardingItem
 * @property {string} title The title of the onboarding item
 * @property {string} path The path of the onboarding item
 * @property {string} content The content of the onboarding item
 * @property {string} category The category of the onboarding item
 * @property {string} index The index of the onboarding item
 * @property {string} publicationDate The publication date of the onboarding item
 * @property {string} locale The locale of the onboarding item
 * @property {string} action The action to perform
 */

export const Types = {};
