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
 * The plugins
 * @typedef {import('@Types').SidekickOptionsConfig} SidekickOptionsConfig
 */

/**
 * @type {SidekickOptionsConfig}
 */
export const defaultSidekickConfig = {
  owner: 'adobe',
  ref: 'main',
  repo: 'aem-boilerplate',
  giturl: 'https://github.com/adobe/aem-boilerplate',
  mountpoint: 'https://drive.google.com/drive/folders/folder-id',
  mountpoints: ['https://drive.google.com/drive/folders/folder-id'],
};
