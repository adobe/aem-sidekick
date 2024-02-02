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
/* eslint-disable no-unused-expressions, import/no-extraneous-dependencies */

// @ts-ignore
import fetchMock from 'fetch-mock/esm/client.js';
import sinon from 'sinon';
import { expect, waitUntil } from '@open-wc/testing';
import chromeMock from './mocks/chrome.js';
import { mockFetchEnglishMessagesSuccess } from './mocks/i18n.js';
import { AEMConfigPicker } from '../src/extension/app/config-picker.js';
import { matchingConfigs } from './fixtures/sidekick-config.js';
import '../src/extension/index.js';
import { recursiveQuery, recursiveQueryAll } from './test-utils.js';

// @ts-ignore
window.chrome = chromeMock;

describe('AEM Config Picker', () => {
  beforeEach(async () => {
    mockFetchEnglishMessagesSuccess();
  });

  afterEach(() => {
    fetchMock.restore();
  });

  it('renders the config picker and makes a selection', async () => {
    const configSelectedSpy = sinon.spy();
    const configPicker = new AEMConfigPicker(matchingConfigs);
    document.body.appendChild(configPicker);

    await waitUntil(() => recursiveQuery(configPicker, 'theme-wrapper'));

    const actionBar = recursiveQuery(configPicker, 'action-bar');

    expect(actionBar).to.exist;

    const configButtons = [...recursiveQueryAll(actionBar, 'sp-action-button')];
    expect(configButtons.length).to.equal(3);

    configPicker.addEventListener('configselected', configSelectedSpy);

    const configButton = configButtons[0];
    configButton.click();

    expect(configSelectedSpy).to.have.been.calledOnce;
    expect(configSelectedSpy.args[0][0].detail.config).to.deep.equal(matchingConfigs[0]);
  });
});
