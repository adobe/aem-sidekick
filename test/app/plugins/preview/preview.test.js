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
  mockSharepointEditorDocFetchStatusSuccess,
  mockFetchConfigJSONNotFound,
  mockGdriveEditorFetchStatusSuccess,
  mockSharepointEditorSheetFetchStatusSuccess,
} from '../../../mocks/helix-admin.js';
import '../../../../src/extension/index.js';
import { appStore } from '../../../../src/extension/app/store/app.js';
import { HelixMockContentType, mockEditorAdminEnvironment, restoreEnvironment } from '../../../mocks/environment.js';
import { EventBus } from '../../../../src/extension/app/utils/event-bus.js';
import { EVENTS, MODALS } from '../../../../src/extension/app/constants.js';

// @ts-ignore
window.chrome = chromeMock;

describe('Preview plugin', () => {
  let sidekick;
  beforeEach(async () => {
    mockFetchEnglishMessagesSuccess();
  });

  afterEach(() => {
    document.body.removeChild(sidekick);
    fetchMock.reset();
    restoreEnvironment(document);
  });

  describe('switching between environments', () => {
    it('previewing from sharepoint editor - docx', async () => {
      mockSharepointEditorDocFetchStatusSuccess();
      mockFetchConfigJSONNotFound();
      mockEditorAdminEnvironment(document, 'editor');
      const updatePreviewSpy = sinon.stub(appStore, 'updatePreview').resolves();
      const tipToast = sinon.stub(appStore, 'showToast').returns();

      sidekick = new AEMSidekick(defaultSidekickConfig);
      document.body.appendChild(sidekick);

      await waitUntil(() => recursiveQuery(sidekick, 'action-bar-picker'));

      const previewPlugin = recursiveQuery(sidekick, '.edit-preview');
      expect(previewPlugin.textContent.trim()).to.equal('Preview');

      previewPlugin.click();

      expect(updatePreviewSpy.calledOnce).to.be.true;
      expect(tipToast.calledOnce).to.be.true;

      updatePreviewSpy.restore();
      tipToast.restore();
    });

    it('previewing from sharepoint editor - sheet', async () => {
      mockSharepointEditorSheetFetchStatusSuccess();
      mockFetchConfigJSONNotFound();
      mockEditorAdminEnvironment(document, 'editor', HelixMockContentType.SHEET);
      const updatePreviewSpy = sinon.stub(appStore, 'updatePreview').resolves();
      const reloadStub = sinon.stub(appStore, 'reloadPage').returns();

      sidekick = new AEMSidekick(defaultSidekickConfig);
      document.body.appendChild(sidekick);

      await waitUntil(() => recursiveQuery(sidekick, 'action-bar-picker'));

      // Click the preview the plugin
      const previewPlugin = recursiveQuery(sidekick, '.edit-preview');
      previewPlugin.click();

      expect(reloadStub.calledOnce).to.be.true;

      // Simulate a reload
      document.body.removeChild(sidekick);

      // Make sure the hlx-sk-preview flag is set
      expect(window.sessionStorage.getItem('hlx-sk-preview')).to.not.be.null;

      // Reset the environment
      sidekick = new AEMSidekick(defaultSidekickConfig);
      document.body.appendChild(sidekick);

      await waitUntil(() => recursiveQuery(sidekick, 'action-bar-picker'));

      expect(updatePreviewSpy.calledOnce).to.be.true;

      // Make sure the hlx-sk-preview flag is unset
      expect(window.sessionStorage.getItem('hlx-sk-preview')).to.be.null;

      updatePreviewSpy.restore();
      reloadStub.restore();
    });

    it('previewing from gdrive editor - doc', async () => {
      mockGdriveEditorFetchStatusSuccess();
      mockFetchConfigJSONNotFound();
      mockEditorAdminEnvironment(document, 'editor', 'doc', 'gdrive');
      const updatePreviewSpy = sinon.stub(appStore, 'updatePreview').resolves();

      sidekick = new AEMSidekick(defaultSidekickConfig);
      document.body.appendChild(sidekick);

      await waitUntil(() => recursiveQuery(sidekick, 'action-bar-picker'));

      const previewPlugin = recursiveQuery(sidekick, '.edit-preview');

      previewPlugin.click();

      expect(updatePreviewSpy.calledOnce).to.be.true;

      updatePreviewSpy.restore();
    });

    it('previewing from gdrive editor - not a valid content type', async () => {
      mockGdriveEditorFetchStatusSuccess();
      mockFetchConfigJSONNotFound();
      mockEditorAdminEnvironment(document, 'editor', 'doc', 'gdrive');

      const modalSpy = sinon.spy();
      EventBus.instance.addEventListener(EVENTS.OPEN_MODAL, modalSpy);

      sidekick = new AEMSidekick(defaultSidekickConfig);
      document.body.appendChild(sidekick);

      await waitUntil(() => recursiveQuery(sidekick, 'action-bar-picker'));

      appStore.status.edit.contentType = 'invalid';

      const previewPlugin = recursiveQuery(sidekick, '.edit-preview');

      previewPlugin.click();

      expect(modalSpy.calledOnce).to.be.true;
      expect(modalSpy.args[0][0].detail.type).to.equal(MODALS.ERROR);
    });

    it('previewing from gdrive editor - not a gdoc type', async () => {
      mockGdriveEditorFetchStatusSuccess();
      mockFetchConfigJSONNotFound();
      mockEditorAdminEnvironment(document, 'editor', 'doc', 'gdrive');

      const modalSpy = sinon.spy();
      EventBus.instance.addEventListener(EVENTS.OPEN_MODAL, modalSpy);

      sidekick = new AEMSidekick(defaultSidekickConfig);
      document.body.appendChild(sidekick);

      await waitUntil(() => recursiveQuery(sidekick, 'action-bar-picker'));

      appStore.status.edit.contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

      const previewPlugin = recursiveQuery(sidekick, '.edit-preview');

      previewPlugin.click();

      expect(modalSpy.calledOnce).to.be.true;
      expect(modalSpy.args[0][0].detail.type).to.equal(MODALS.ERROR);
    });

    it('previewing from gdrive editor - not a gsheet type', async () => {
      mockGdriveEditorFetchStatusSuccess();
      mockFetchConfigJSONNotFound();
      mockEditorAdminEnvironment(document, 'editor', 'doc', 'gdrive');

      const modalSpy = sinon.spy();
      EventBus.instance.addEventListener(EVENTS.OPEN_MODAL, modalSpy);

      sidekick = new AEMSidekick(defaultSidekickConfig);
      document.body.appendChild(sidekick);

      await waitUntil(() => recursiveQuery(sidekick, 'action-bar-picker'));

      appStore.status.edit.contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

      const previewPlugin = recursiveQuery(sidekick, '.edit-preview');

      previewPlugin.click();

      expect(modalSpy.calledOnce).to.be.true;
      expect(modalSpy.args[0][0].detail.type).to.equal(MODALS.ERROR);
    });
  });
});
