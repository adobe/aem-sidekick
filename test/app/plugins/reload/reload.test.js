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
import { aTimeout, expect, waitUntil } from '@open-wc/testing';
import { recursiveQuery } from '../../../test-utils.js';
import chromeMock from '../../../mocks/chrome.js';
import { AEMSidekick } from '../../../../src/extension/app/aem-sidekick.js';
import { mockFetchEnglishMessagesSuccess } from '../../../mocks/i18n.js';
import { defaultSidekickConfig } from '../../../fixtures/sidekick-config.js';
import {
  mockFetchConfigWithoutPluginsOrHostJSONSuccess,
  mockFetchStatusSuccess,
} from '../../../mocks/helix-admin.js';
import '../../../../src/extension/index.js';
import { appStore } from '../../../../src/extension/app/store/app.js';
import {
  mockHelixEnvironment, restoreEnvironment,
} from '../../../mocks/environment.js';
import { EventBus } from '../../../../src/extension/app/utils/event-bus.js';
import { EVENTS, MODALS } from '../../../../src/extension/app/constants.js';

// @ts-ignore
window.chrome = chromeMock;

describe('Reload plugin', () => {
  let sidekick;
  let sandbox;
  let reloaded = false;

  before(() => {
    sandbox = sinon.createSandbox();
    sandbox.stub(appStore, 'reloadPage').callsFake(() => {
      reloaded = true;
    });
  });

  beforeEach(async () => {
    mockFetchEnglishMessagesSuccess();
    mockFetchStatusSuccess();
    mockFetchConfigWithoutPluginsOrHostJSONSuccess();
    mockHelixEnvironment(document, 'preview');

    sidekick = new AEMSidekick(defaultSidekickConfig);
    document.body.appendChild(sidekick);
    reloaded = false;
  });

  afterEach(() => {
    document.body.removeChild(sidekick);
    fetchMock.reset();
    restoreEnvironment(document);
    sandbox.restore();
  });

  it('reload calls appStore.update() and reloads window', async () => {
    const updateStub = sandbox.stub(appStore, 'update')
      .resolves(new Response('', { status: 200, headers: {} }));
    const showWaitSpy = sandbox.spy(appStore, 'showWait');
    const hideWaitSpy = sandbox.spy(appStore, 'hideWait');

    await waitUntil(() => recursiveQuery(sidekick, 'action-bar-picker'));

    const reloadPlugin = recursiveQuery(sidekick, '.reload');
    expect(reloadPlugin.textContent.trim()).to.equal('Reload');

    reloadPlugin.dispatchEvent(new Event('click'));

    await aTimeout(500);

    await waitUntil(() => updateStub.calledOnce === true);

    expect(updateStub.calledOnce).to.be.true;
    expect(showWaitSpy.calledOnce).to.be.true;
    expect(hideWaitSpy.calledOnce).to.be.true;
    expect(reloaded).to.be.true;
  });

  it('reload handles failure', async () => {
    const updateStub = sandbox.stub(appStore, 'update')
      .resolves(new Response('', { status: 500, headers: {} }));
    const showWaitSpy = sandbox.spy(appStore, 'showWait');

    const modalSpy = sandbox.spy();
    EventBus.instance.addEventListener(EVENTS.OPEN_MODAL, modalSpy);

    await waitUntil(() => recursiveQuery(sidekick, 'action-bar-picker'));

    const reloadPlugin = recursiveQuery(sidekick, '.reload');

    reloadPlugin.click();

    await waitUntil(() => updateStub.calledOnce === true);

    expect(updateStub.calledOnce).to.be.true;
    expect(showWaitSpy.calledOnce).to.be.true;

    expect(modalSpy.calledTwice).to.be.true;
    expect(modalSpy.args[0][0].detail.type).to.equal(MODALS.WAIT);
    expect(modalSpy.args[1][0].detail.type).to.equal(MODALS.ERROR);

    expect(reloaded).to.be.false;
  });
});
