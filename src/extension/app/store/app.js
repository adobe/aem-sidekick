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

import { makeAutoObservable } from 'mobx';

/**
 * The configuration object for the active site
 * @typedef {Object} SiteConfig
 * @property {string} giturl - The url to github repository
 * @property {string[]} mountpoints - The mountpoints for the site
 * @property {string} owner - The organization or user
 * @property {string} ref - The branch
 * @property {string} repo - The repository
 */

class AppStore {
  /**
   * @type {SiteConfig}
   */
  siteConfig;

  constructor() {
    makeAutoObservable(this);
  }

  /**
   * Sets the site config
   * @param {SiteConfig} config
   */
  setSiteConfig(config) {
    this.siteConfig = config;
  }
}

export const appStore = new AppStore();
