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

// import { property } from 'lit/decorators.js';
import { observable, action } from 'mobx';
import { log } from '../../log.js';
import { callAdmin } from '../../utils/admin.js';
import { getLanguage } from '../utils/i18n.js';

/**
 * The sidekick options configuration object type
 * @typedef {import('@Types').SidekickOptionsConfig} SidekickOptionsConfig
 */

/**
 * The sidekick configuration object type
 * @typedef {import('@Types').SidekickConfig} SidekickConfig
 */

/**
 * @typedef {import('./app.js').AppStore} AppStore
 */

/**
 * The CustomPlugin type
 * @typedef {import('@Types').CustomPlugin} CustomPlugin
 */

export class SiteStore {
  /**
   * The GitHub owner or organization (mandatory)
   * @type {string}
   */
  owner;

  /**
   * The GitHub repo (mandatory)
   * @type {string}
   */
  repo;

  /**
   * The Git reference or branch (optional)
   * @type {string}
   */
  ref;

  /**
   * The url to the repository
   * @type {string}
   */
  giturl;

  /**
   * The content source URL (optional)
   * @type {string}
   */
  mountpoint;

  /**
   * An arround of content source URLs (optional)
   * @type {string[]}
   */
  mountpoints;

  /**
   * The name of the project used in the sharing link (optional)
   * @type {string}
   */
  project;

  /**
   * The production host name to publish content to (optional)
   * @type {string}
   */
  host;

  /**
   * The host name of a custom preview CDN (optional)
   * @type {string}
   */
  previewHost;

  /**
   * Inner CDN host name (custom or std)
   * @type {string}
   */
  innerHost;

  /**
   * Standard Inner CDN host name
   * @type {string}
   */
  stdInnerHost;

  /**
   * The host name of a custom live CDN (optional)
   * @type {string}
   */
  liveHost;

  /**
   * Inner CDN host name (custom or std)
   * @type {string}
   */
  outerHost;

  /**
   * Standard Outer CDN host name
   * @type {string}
   */
  stdOuterHost;

  /**
   * URL of the local development environment
   * @type {string}
   */
  devOrigin;

  /**
   * The specific version of admin service to use (optional)
   * @type {string}
   */
  adminVersion;

  /**
   * User language preference
   * @type {string}
   */
  lang;

  /**
   * Custom views
   * @type {import('@Types').ViewConfig[]}
   */
  views;

  /**
   * Custom views
   * @type {CustomPlugin[]}
   */
  plugins;

  /**
   * The status code of the config response.
   * @type {number}
   */
  status;

  /**
   * The error message of the config response.
   * @type {string}
   */
  error;

  /**
   * Is this site in transient mode?
   * @type {boolean}
   */
  transient;

  /**
   * Has the store been initialized?
   * @type {boolean}
   */
  @observable accessor ready = false;

  /**
   * @param {AppStore} appStore
   */
  constructor(appStore) {
    this.appStore = appStore;
  }

  /**
   * Set as initialized.
   */
  @action
  setReady() {
    this.ready = true;
  }

  /**
   * Initializes the site store
   * @param {SidekickOptionsConfig} cfg
   */
  async initStore(cfg) {
    let config = cfg || (window.hlx && window.hlx.sidekickConfig) || {};
    const {
      owner,
      repo,
      ref = 'main',
      giturl,
      mountpoints,
      adminVersion,
    } = config;
    let { devOrigin } = config;
    if (!devOrigin) {
      devOrigin = 'http://localhost:3000';
    }
    if (owner && repo) {
      // look for custom config in project
      try {
        const res = await callAdmin(
          {
            owner, repo, ref, adminVersion,
          },
          'sidekick',
          '/config.json',
        );
        this.status = res.status;
        if (this.status === 200) {
          config = {
            ...config,
            ...await res.json(),
            // no overriding below
            owner,
            repo,
            ref,
            mountpoints,
            adminVersion,
          };
        } else {
          this.error = res.headers.get('x-error');
        }
      } catch (e) {
        this.error = e.message;
        /* istanbul ignore next */
        log.debug('error retrieving custom sidekick config', e);
      }
    }

    const {
      lang,
      contentSourceUrl,
      contentSourceType,
      editUrlLabel,
      editUrlPattern,
      previewHost,
      liveHost,
      outerHost: legacyLiveHost,
      reviewHost,
      host,
      project = '',
      specialViews,
      transient = false,
      scriptUrl = 'https://www.hlx.live/tools/sidekick/index.js',
    } = config;
    const publicHost = host && host.startsWith('http') ? new URL(host).host : host;
    const hostPrefix = owner && repo ? `${ref}--${repo}--${owner}` : null;
    const domain = previewHost?.endsWith('.aem.page') ? 'aem' : 'hlx';
    const stdInnerHost = hostPrefix ? `${hostPrefix}.${domain}.page` : null;
    const stdOuterHost = hostPrefix ? `${hostPrefix}.${domain}.live` : null;
    const stdReviewHost = hostPrefix ? `${hostPrefix}.aem.reviews` : null;
    const devUrl = new URL(devOrigin);

    // default views
    this.views = [
      {
        path: '**.json',
        viewer: chrome.runtime.getURL('views/json/json.html'),
        title: () => this.appStore.i18n('json_view_description'),
      },
    ];
    // prepend custom views
    this.views = (specialViews || []).concat(this.views);
    this.plugins = config.plugins || [];

    this.owner = owner;
    this.repo = repo;
    this.ref = ref;
    this.giturl = giturl;
    this.contentSourceUrl = contentSourceUrl;
    this.contentSourceType = contentSourceType;
    this.contentSourceEditLabel = editUrlLabel;
    this.contentSourceEditPattern = editUrlPattern;

    this.mountpoints = contentSourceUrl ? [contentSourceUrl] : (mountpoints || []);
    [this.mountpoint] = this.mountpoints;
    this.adminVersion = adminVersion;

    this.previewHost = previewHost;
    this.liveHost = liveHost;
    this.scriptUrl = scriptUrl;

    this.innerHost = previewHost || stdInnerHost;
    this.outerHost = liveHost || legacyLiveHost || stdOuterHost;
    this.reviewHost = reviewHost || stdReviewHost;
    this.stdInnerHost = stdInnerHost;
    this.stdOuterHost = stdOuterHost;
    this.stdReviewHost = stdReviewHost;
    this.host = publicHost;
    this.project = project;
    this.devUrl = devUrl;
    this.lang = lang || getLanguage();
    this.transient = transient;
    this.setReady();

    // send config to service worker to update sync storage
    if (!this.transient && this.status === 200 && this.owner && this.repo) {
      chrome.runtime.sendMessage({
        action: 'updateProject',
        config: {
          owner: this.owner,
          repo: this.repo,
          ref: this.ref,
          project: this.project,
          previewHost: this.previewHost,
          reviewHost: this.reviewHost,
          liveHost: this.liveHost,
          host: this.host,
          mountpoints: this.mountpoints,
        },
      });
    }
  }

  /**
   * Serializes the store to JSON
   * @returns { SidekickConfig }
   */
  toJSON() {
    return {
      owner: this.owner,
      repo: this.repo,
      ref: this.ref,
      giturl: this.giturl,
      devUrl: this.devUrl.href,
      // @ts-ignore
      mountpoint: this.mountpoint,
      mountpoints: this.mountpoints,
      project: this.project,
      host: this.host,
      previewHost: this.previewHost,
      innerHost: this.innerHost,
      stdInnerHost: this.stdInnerHost,
      liveHost: this.liveHost,
      outerHost: this.outerHost,
      stdOuterHost: this.stdOuterHost,
      reviewHost: this.reviewHost,
      stdReviewHost: this.stdReviewHost,
      devOrigin: this.devOrigin,
      adminVersion: this.adminVersion,
      lang: this.lang,
      views: this.views,
    };
  }
}
