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

/* eslint-disable import/no-extraneous-dependencies */

// @ts-ignore
import fetchMock from 'fetch-mock/esm/client.js';

import enMessages from '../../src/extension/_locales/en/messages.json' assert { type: 'json' };

export const englishMessagesUrl = '/test/wtr/fixtures/_locales/en/messages.json';
export const mockFetchEnglishMessagesSuccess = () => fetchMock.get(englishMessagesUrl, {
  status: 200,
  body: enMessages,
}, { overwriteRoutes: true });
