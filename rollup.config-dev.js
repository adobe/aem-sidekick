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
// @ts-nocheck

/* eslint-disable import/no-extraneous-dependencies */

import { createExtension, viewBuild } from './rollup.config.js';

export default [
  {
    input: 'src/extension/views/json/json.js',
    ...viewBuild('chrome', '/views/json'),
  },
  {
    input: 'src/extension/views/login/login.js',
    ...viewBuild('chrome', '/views/login'),
  },
  ...createExtension('chrome'),
];
