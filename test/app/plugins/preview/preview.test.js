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
import { recursiveQuery } from '../../../test-utils.js';
import chromeMock from '../../../mocks/chrome.js';
import { defaultSidekickConfig } from '../../../fixtures/sidekick-config.js';
import '../../../../src/extension/index.js';
import { AppStore } from '../../../../src/extension/app/store/app.js';
import { MODALS } from '../../../../src/extension/app/constants.js';
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

  beforeEach(async () => {
    appStore = new AppStore();
    sidekickTest = new SidekickTest(defaultSidekickConfig, appStore);
    sidekickTest
      .mockFetchSidekickConfigSuccess(false, false);
  });

  afterEach(() => {
    sidekickTest.destroy();
  });

  describe('switching between environments', () => {
    it('previewing from sharepoint editor - docx', async () => {
      const { sandbox } = sidekickTest;
      sidekickTest
        .mockEditorAdminEnvironment(
          EditorMockEnvironments.EDITOR,
          HelixMockContentType.DOC,
          HelixMockContentSources.SHAREPOINT,
        ).mockFetchEditorStatusSuccess(HelixMockContentSources.SHAREPOINT,
          HelixMockContentType.DOC,
        );

      sidekick = sidekickTest.createSidekick();

      const updatePreviewSpy = sandbox.stub(appStore, 'updatePreview').resolves();
      // @ts-ignore
      const tipToast = sandbox.stub(appStore, 'showToast').returns();

      await sidekickTest.awaitEnvSwitcher();

      const previewPlugin = recursiveQuery(sidekick, '.edit-preview');
      expect(previewPlugin.textContent.trim()).to.equal('Preview');
      await waitUntil(() => previewPlugin.getAttribute('disabled') === null);

      previewPlugin.click();

      await waitUntil(() => updatePreviewSpy.calledOnce === true);
      expect(updatePreviewSpy.calledOnce).to.be.true;
      expect(tipToast.calledOnce).to.be.true;
    });

    it('previewing from sharepoint editor - sheet', async () => {
      const { sandbox } = sidekickTest;
      // @ts-ignore
      sandbox.stub(appStore, 'showView').returns();

      sidekickTest
        .mockFetchEditorStatusSuccess(HelixMockContentSources.SHAREPOINT,
          HelixMockContentType.SHEET,
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

      await waitUntil(() => reloadStub.calledOnce === true);
      expect(reloadStub.calledOnce).to.be.true;

      // Simulate a reload
      document.body.removeChild(sidekick);

      // Make sure the hlx-sk-preview flag is set
      expect(window.sessionStorage.getItem('hlx-sk-preview')).to.not.be.null;

      // Reset the environment
      sidekick = sidekickTest.createSidekick();

      await sidekickTest.awaitEnvSwitcher();
      await aTimeout(500);

      // Make sure the hlx-sk-preview flag is unset
      expect(window.sessionStorage.getItem('hlx-sk-preview')).to.be.null;
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
        );

      const { sandbox } = sidekickTest;
      const updatePreviewSpy = sandbox.stub(appStore, 'updatePreview').resolves();

      sidekick = sidekickTest.createSidekick();

      await sidekickTest.awaitEnvSwitcher();

      const previewPlugin = recursiveQuery(sidekick, '.edit-preview');

      previewPlugin.click();
      await waitUntil(() => updatePreviewSpy.calledOnce === true);

      expect(updatePreviewSpy.calledOnce).to.be.true;
    });

    it('previewing from gdrive editor - not a valid content type', async () => {
      sidekickTest
        .mockEditorAdminEnvironment(
          EditorMockEnvironments.EDITOR,
          HelixMockContentType.DOC,
          HelixMockContentSources.GDRIVE,
        ).mockFetchEditorStatusSuccess(
          HelixMockContentSources.GDRIVE,
          HelixMockContentType.DOC,
        );

      const { sandbox } = sidekickTest;
      const modalSpy = sandbox.spy(appStore, 'showModal');

      sidekick = sidekickTest.createSidekick();

      await sidekickTest.awaitEnvSwitcher();

      appStore.status.edit.contentType = 'invalid';

      const previewPlugin = recursiveQuery(sidekick, '.edit-preview');
      previewPlugin.click();

      await waitUntil(() => modalSpy.calledOnce === true);
      expect(modalSpy.calledOnce).to.be.true;
      expect(modalSpy.args[0][0].type).to.equal(MODALS.ERROR);
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
        );

      const { sandbox } = sidekickTest;
      const modalSpy = sandbox.spy(appStore, 'showModal');

      sidekick = sidekickTest.createSidekick();

      await sidekickTest.awaitEnvSwitcher();

      appStore.status.edit.contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

      const previewPlugin = recursiveQuery(sidekick, '.edit-preview');

      previewPlugin.click();

      await waitUntil(() => modalSpy.calledOnce === true);
      expect(modalSpy.calledOnce).to.be.true;
      expect(modalSpy.args[0][0].type).to.equal(MODALS.ERROR);
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
        );

      const { sandbox } = sidekickTest;
      const modalSpy = sandbox.spy(appStore, 'showModal');

      sidekick = sidekickTest.createSidekick();

      await sidekickTest.awaitEnvSwitcher();

      appStore.status.edit.contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

      const previewPlugin = recursiveQuery(sidekick, '.edit-preview');

      previewPlugin.click();

      await waitUntil(() => modalSpy.calledOnce === true);
      expect(modalSpy.calledOnce).to.be.true;
      expect(modalSpy.args[0][0].type).to.equal(MODALS.ERROR);
    });
  });
});
