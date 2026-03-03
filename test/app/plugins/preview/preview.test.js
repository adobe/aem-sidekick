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

import { aTimeout, expect, waitUntil } from '@open-wc/testing';
import { error, recursiveQuery } from '../../../test-utils.js';
import chromeMock from '../../../mocks/chrome.js';
import { defaultSidekickConfig } from '../../../fixtures/sidekick-config.js';
import '../../../../src/extension/index.js';
import { AppStore } from '../../../../src/extension/app/store/app.js';
import { SidekickTest } from '../../../sidekick-test.js';
import { EditorMockEnvironments, HelixMockContentSources, HelixMockContentType } from '../../../mocks/environment.js';

/**
 * The AEMSidekick object type
 * @typedef {import('../../../../src/extension/app/aem-sidekick.js').AEMSidekick} AEMSidekick
 */

// @ts-ignore
window.chrome = chromeMock;

describe('Preview plugin', () => {
  /**
   * @type {SidekickTest}
   */
  let sidekickTest;

  /**
   * @type {AEMSidekick}
   */
  let sidekick;

  /**
   * @type {AppStore}
   */
  let appStore;

  let updatePreviewStub;
  let sendMessageStub;

  beforeEach(async () => {
    appStore = new AppStore();
    sidekickTest = new SidekickTest(defaultSidekickConfig, appStore);
    sidekickTest
      .mockFetchSidekickConfigSuccess(false, false);

    updatePreviewStub = sidekickTest.sandbox.stub(appStore, 'updatePreview').resolves();
    sendMessageStub = sidekickTest.sandbox.stub(chrome.runtime, 'sendMessage');
    sendMessageStub.resolves(true);
  });

  afterEach(() => {
    sidekickTest.destroy();
  });

  describe('switching between environments', () => {
    it('previewing from sharepoint editor - docx', async () => {
      sidekickTest
        .mockEditorAdminEnvironment(
          EditorMockEnvironments.EDITOR,
          HelixMockContentType.DOC,
          HelixMockContentSources.SHAREPOINT,
        ).mockFetchEditorStatusSuccess(HelixMockContentSources.SHAREPOINT,
          HelixMockContentType.DOC,
          {
            edit: {
              status: 200,
              sourceLocation: 'onedrive:driveid',
              contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            },
          },
        );

      sidekick = sidekickTest.createSidekick();

      await sidekickTest.awaitEnvSwitcher();

      const previewPlugin = recursiveQuery(sidekick, '.edit-preview');
      expect(previewPlugin.textContent.trim()).to.equal('Preview');
      await waitUntil(() => previewPlugin.getAttribute('disabled') === null);

      previewPlugin.click();

      await waitUntil(() => updatePreviewStub.calledOnce, null, { timeout: 2000 });
      expect(updatePreviewStub.calledOnce).to.be.true;
      expect(sidekickTest.rumStub.calledWith('click', {
        source: 'sidekick',
        target: 'previewed',
      })).to.be.true;
    });

    it('previewing from sharepoint editor - sheet', async () => {
      const { sandbox } = sidekickTest;
      // @ts-ignore
      sandbox.stub(appStore, 'showView').returns();

      sidekickTest
        .mockFetchEditorStatusSuccess(HelixMockContentSources.SHAREPOINT,
          HelixMockContentType.SHEET,
          {
            edit: {
              status: 200,
              sourceLocation: 'onedrive:driveid',
              contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            },
          },
        ).mockEditorAdminEnvironment(
          EditorMockEnvironments.EDITOR,
          HelixMockContentType.SHEET,
        );

      const reloadStub = sandbox.stub(appStore, 'reloadPage').returns();

      sidekick = sidekickTest.createSidekick();

      await sidekickTest.awaitEnvSwitcher();

      // Click the preview the plugin
      const previewPlugin = recursiveQuery(sidekick, '.edit-preview');
      previewPlugin.click();

      await waitUntil(() => reloadStub.calledOnce);
      expect(reloadStub.calledOnce).to.be.true;

      // Simulate a reload
      document.body.removeChild(sidekick);

      // Make sure the aem-sk-preview flag is set
      expect(window.sessionStorage.getItem('aem-sk-preview')).to.not.be.null;

      // Reset the environment
      sidekick = sidekickTest.createSidekick();
      await aTimeout(1000);

      expect(updatePreviewStub.calledOnce).to.be.true;

      // Make sure the aem-sk-preview flag is unset
      expect(window.sessionStorage.getItem('aem-sk-preview')).to.be.null;
    });

    it('previewing from gdrive editor - doc', async () => {
      sidekickTest
        .mockEditorAdminEnvironment(
          EditorMockEnvironments.EDITOR,
          HelixMockContentType.DOC,
          HelixMockContentSources.GDRIVE,
        ).mockFetchEditorStatusSuccess(
          HelixMockContentSources.GDRIVE,
          HelixMockContentType.DOC,
          {
            edit: {
              status: 200,
              sourceLocation: 'gdrive:driveid',
              contentType: 'application/vnd.google-apps.document',
            },
          },
        );

      sidekick = sidekickTest.createSidekick();

      await sidekickTest.awaitEnvSwitcher();

      const previewPlugin = recursiveQuery(sidekick, '.edit-preview');

      previewPlugin.click();
      await waitUntil(() => updatePreviewStub.calledOnce, null, { timeout: 2000 });

      expect(updatePreviewStub.calledOnce).to.be.true;
      expect(sidekickTest.rumStub.calledWith('click', {
        source: 'sidekick',
        target: 'previewed',
      })).to.be.true;
    });

    it('previewing from gdrive editor - not a valid content type with toast dismiss', async () => {
      sidekickTest
        .mockEditorAdminEnvironment(
          EditorMockEnvironments.EDITOR,
          HelixMockContentType.DOC,
          HelixMockContentSources.GDRIVE,
        ).mockFetchEditorStatusSuccess(
          HelixMockContentSources.GDRIVE,
          HelixMockContentType.DOC,
          {
            edit: {
              status: 200,
              sourceLocation: 'gdrive:driveid',
              contentType: 'application/vnd.openxmlformats-officedocument.fooml.document',
            },
          },
        );

      const { sandbox } = sidekickTest;
      const toastSpy = sandbox.spy(appStore, 'showToast');
      const closeToastSpy = sandbox.spy(appStore, 'closeToast');

      sidekick = sidekickTest.createSidekick();

      await sidekickTest.awaitEnvSwitcher();

      appStore.status.edit.contentType = 'invalid';

      const previewPlugin = recursiveQuery(sidekick, '.edit-preview');
      previewPlugin.click();

      await waitUntil(() => toastSpy.calledOnce);

      await sidekickTest.clickToastClose();
      expect(closeToastSpy.calledOnce);
      expect(toastSpy.calledOnceWith({
        message: 'Preview generation failed. Must be Google document or spreadsheet.',
        variant: 'warning',
      }));
    });

    it('previewing from gdrive editor - not a gdoc type', async () => {
      sidekickTest
        .mockEditorAdminEnvironment(
          EditorMockEnvironments.EDITOR,
          HelixMockContentType.DOC,
          HelixMockContentSources.GDRIVE,
        ).mockFetchEditorStatusSuccess(
          HelixMockContentSources.GDRIVE,
          HelixMockContentType.DOC,
          {
            edit: {
              status: 200,
              sourceLocation: 'gdrive:driveid',
              contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            },
          },
        );

      const { sandbox } = sidekickTest;
      const toastSpy = sandbox.spy(appStore, 'showToast');

      sidekick = sidekickTest.createSidekick();

      await sidekickTest.awaitEnvSwitcher();

      const previewPlugin = recursiveQuery(sidekick, '.edit-preview');

      previewPlugin.click();

      await waitUntil(() => toastSpy.calledOnce);
      expect(toastSpy.calledOnceWith({
        message: 'This is a Microsoft Word document. Please convert it to Google Docs first.',
        variant: 'warning',
      }));
    });

    it('previewing from gdrive editor - not a gsheet type', async () => {
      sidekickTest
        .mockEditorAdminEnvironment(
          EditorMockEnvironments.EDITOR,
          HelixMockContentType.DOC,
          HelixMockContentSources.GDRIVE,
        ).mockFetchEditorStatusSuccess(
          HelixMockContentSources.GDRIVE,
          HelixMockContentType.DOC,
          {
            edit: {
              status: 200,
              sourceLocation: 'gdrive:driveid',
              contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            },
          },
        );

      const { sandbox } = sidekickTest;
      const toastSpy = sandbox.spy(appStore, 'showToast');

      sidekick = sidekickTest.createSidekick();

      await sidekickTest.awaitEnvSwitcher();

      const previewPlugin = recursiveQuery(sidekick, '.edit-preview');

      previewPlugin.click();

      await waitUntil(() => toastSpy.calledOnce);
      expect(toastSpy.calledOnceWith({
        message: 'This is a Microsoft Excel document. Please convert it to Google Sheets first.',
        variant: 'warning',
      }));
    });

    it('previewing a config file', async () => {
      sidekickTest
        .mockEditorAdminEnvironment(
          EditorMockEnvironments.EDITOR,
          HelixMockContentType.DOC,
          HelixMockContentSources.SHAREPOINT,
        ).mockFetchEditorStatusSuccess(HelixMockContentSources.SHAREPOINT,
          HelixMockContentType.ADMIN,
          {
            webPath: '/.helix/config.json',
          },
        );

      sidekick = sidekickTest.createSidekick();
      await sidekickTest.awaitEnvSwitcher();

      const previewPlugin = recursiveQuery(sidekick, '.edit-preview');
      expect(previewPlugin.textContent).to.equal('Activate');
    });
  });

  describe('error handling', () => {
    it('fails gracefully if save document call fails', async () => {
      sidekickTest
        .mockEditorAdminEnvironment(
          EditorMockEnvironments.EDITOR,
          HelixMockContentType.DOC,
          HelixMockContentSources.SHAREPOINT,
        ).mockFetchEditorStatusSuccess(HelixMockContentSources.SHAREPOINT,
          HelixMockContentType.DOC);

      sidekick = sidekickTest.createSidekick();
      await sidekickTest.awaitEnvSwitcher();

      sendMessageStub.rejects(error);

      const previewPlugin = recursiveQuery(sidekick, '.edit-preview');
      previewPlugin.click();

      await waitUntil(() => updatePreviewStub.calledOnce, null, { timeout: 3000 });

      expect(updatePreviewStub.called).to.be.true;
    });

    it('does not preview from illegal path', async () => {
      const { sandbox } = sidekickTest;
      sidekickTest
        .mockEditorAdminEnvironment(
          EditorMockEnvironments.EDITOR,
          HelixMockContentType.DOC,
          HelixMockContentSources.SHAREPOINT,
        ).mockFetchEditorStatusSuccess(HelixMockContentSources.SHAREPOINT,
          HelixMockContentType.ADMIN,
          {
            edit: {
              status: 200,
              sourceLocation: 'onedrive:driveid',
              contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              illegalPath: '/path to/document',
            },
          },
        );

      sidekick = sidekickTest.createSidekick();

      const showToastSpy = sandbox.spy(appStore, 'showToast');

      await sidekickTest.awaitEnvSwitcher();

      const previewPlugin = recursiveQuery(sidekick, '.edit-preview');
      expect(previewPlugin.textContent.trim()).to.equal('Preview');
      await waitUntil(() => previewPlugin.getAttribute('disabled') === null);

      previewPlugin.click();

      await waitUntil(() => showToastSpy.calledOnce);
      expect(showToastSpy.calledWithMatch({
        variant: 'warning',
        timeout: 0,
      })).to.be.true;
      expect(updatePreviewStub.calledOnce).to.be.false;
    });
  });
});
