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
import { recursiveQuery } from '../../../test-utils.js';
import chromeMock from '../../../mocks/chrome.js';
import { AEMSidekick } from '../../../../src/extension/app/aem-sidekick.js';
import { mockFetchEnglishMessagesSuccess } from '../../../mocks/i18n.js';
import { defaultSidekickConfig } from '../../../fixtures/sidekick-config.js';
import {
  mockFetchConfigJSONNotFound,
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

describe('Preview plugin', () => {
  let sidekick;
  const sandbox = sinon.createSandbox();

  beforeEach(async () => {
    mockFetchEnglishMessagesSuccess();
  });

  afterEach(() => {
    document.body.removeChild(sidekick);
    fetchMock.reset();
    restoreEnvironment(document);
    sandbox.restore();
  });

  describe('switching between environments', () => {
    it('publish from preview - docx', async () => {
      mockFetchStatusSuccess();
      mockFetchConfigWithoutPluginsOrHostJSONSuccess();
      mockHelixEnvironment(document, 'preview');
      const publishStub = sandbox.stub(appStore, 'publish').resolves({ ok: true, status: 200 });
      const switchEnvStub = sandbox.stub(appStore, 'switchEnv').returns();
      const showWaitSpy = sandbox.spy(appStore, 'showWait');
      const hideWaitSpy = sandbox.spy(appStore, 'hideWait');

      sidekick = new AEMSidekick(defaultSidekickConfig);
      document.body.appendChild(sidekick);

      await waitUntil(() => recursiveQuery(sidekick, 'action-bar-picker'));

      const publishPlugin = recursiveQuery(sidekick, '.publish');
      expect(publishPlugin.textContent.trim()).to.equal('Publish');
      await waitUntil(() => publishPlugin.getAttribute('disabled') === null);
      publishPlugin.click();

      await waitUntil(() => publishStub.calledOnce === true);

      expect(publishStub.calledOnce).to.be.true;
      expect(switchEnvStub.calledOnce).to.be.true;
      expect(showWaitSpy.calledOnce).to.be.true;
      expect(hideWaitSpy.calledOnce).to.be.true;

      publishStub.restore();
      switchEnvStub.restore();
      showWaitSpy.restore();
      hideWaitSpy.restore();
    });

    it('publish from preview - failure', async () => {
      mockFetchStatusSuccess();
      mockFetchConfigJSONNotFound();
      mockHelixEnvironment(document, 'preview');
      const publishStub = sandbox.stub(appStore, 'publish').resolves({ ok: false, status: 500 });
      const showWaitSpy = sandbox.spy(appStore, 'showWait');

      const modalSpy = sandbox.spy();
      EventBus.instance.addEventListener(EVENTS.OPEN_MODAL, modalSpy);

      sidekick = new AEMSidekick(defaultSidekickConfig);
      document.body.appendChild(sidekick);

      await waitUntil(() => recursiveQuery(sidekick, 'action-bar-picker'));

      const publishPlugin = recursiveQuery(sidekick, '.publish');
      expect(publishPlugin.textContent.trim()).to.equal('Publish');

      publishPlugin.click();

      await waitUntil(() => publishStub.calledOnce === true);

      expect(publishStub.calledOnce).to.be.true;
      expect(showWaitSpy.calledOnce).to.be.true;

      expect(modalSpy.calledTwice).to.be.true;
      expect(modalSpy.args[0][0].detail.type).to.equal(MODALS.WAIT);
      expect(modalSpy.args[1][0].detail.type).to.equal(MODALS.ERROR);

      publishStub.restore();
      showWaitSpy.restore();
    });
  });
});
