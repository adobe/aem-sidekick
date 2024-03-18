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

/* eslint-disable no-unused-expressions, import/no-extraneous-dependencies, max-len */

// @ts-ignore
import sinon from 'sinon';
import {
  expect, waitUntil, aTimeout,
} from '@open-wc/testing';
import { EventBus } from '../../../../src/extension/app/utils/event-bus.js';
import { MODALS, MODAL_EVENTS } from '../../../../src/extension/app/constants.js';
import chromeMock from '../../../mocks/chrome.js';
import { AEMSidekick } from '../../../../src/extension/index.js';
import { recursiveQuery } from '../../../test-utils.js';
import { mockFetchEnglishMessagesSuccess } from '../../../mocks/i18n.js';
import { appStore } from '../../../../src/extension/app/store/app.js';
import { fetchLanguageDict } from '../../../../src/extension/app/utils/i18n.js';
import { defaultSidekickConfig } from '../../../fixtures/sidekick-config.js';
import { mockFetchConfigWithoutPluginsJSONSuccess, mockFetchStatusSuccess } from '../../../mocks/helix-admin.js';
import { mockHelixEnvironment, restoreEnvironment } from '../../../mocks/environment.js';

// @ts-ignore
window.chrome = chromeMock;

/**
 * @typedef {import('../../../../src/extension/app/components/modal/modal-container.js').ModalContainer} ModalContainer
 */

describe('Modals', () => {
  let sidekick;
  let sandbox;
  beforeEach(async () => {
    sandbox = sinon.createSandbox();
    mockFetchEnglishMessagesSuccess();
    mockFetchStatusSuccess();
    mockFetchConfigWithoutPluginsJSONSuccess();
    mockHelixEnvironment(document, 'preview');
    appStore.languageDict = await fetchLanguageDict(undefined, 'en');
  });

  afterEach(() => {
    if (document.body.contains(sidekick)) {
      document.body.removeChild(sidekick);
    }
    restoreEnvironment(document);
  });

  it('renders wait modal and closes', async () => {
    sidekick = new AEMSidekick(defaultSidekickConfig);
    document.body.appendChild(sidekick);

    await waitUntil(() => recursiveQuery(sidekick, 'action-bar-picker'));
    appStore.showModal({
      type: MODALS.WAIT,
      data: {
        message: 'test',
      },
    });

    const modal = recursiveQuery(sidekick, 'modal-container');

    await waitUntil(() => recursiveQuery(modal, 'sp-dialog-wrapper'));
    const dialogWrapper = recursiveQuery(modal, 'sp-dialog-wrapper');

    expect(dialogWrapper.getAttribute('open')).to.equal('');

    EventBus.instance.dispatchEvent(new CustomEvent(MODAL_EVENTS.CLOSE));

    expect(modal.modal).to.be.undefined;
  });

  it('displays error modal', async () => {
    sidekick = new AEMSidekick(defaultSidekickConfig);
    document.body.appendChild(sidekick);

    await waitUntil(() => recursiveQuery(sidekick, 'action-bar-picker'));
    appStore.showModal({
      type: MODALS.ERROR,
      data: {
        message: 'There was an error',
        headline: 'Oh snap',
      },
    });

    const confirmSpy = sandbox.spy();
    const modal = recursiveQuery(sidekick, 'modal-container');
    modal.addEventListener('confirm', confirmSpy);

    await waitUntil(() => recursiveQuery(modal, 'sp-dialog-wrapper'));
    const dialogWrapper = recursiveQuery(modal, 'sp-dialog-wrapper');

    expect(dialogWrapper.getAttribute('open')).to.equal('');

    const dialogHeading = recursiveQuery(dialogWrapper, 'h2');
    expect(dialogHeading.textContent.trim()).to.eq('Oh snap');
    expect(dialogWrapper.textContent.trim()).to.eq('There was an error');
    const okButton = recursiveQuery(dialogWrapper, 'sp-button');
    expect(okButton).to.exist;
    okButton.click();

    await aTimeout(100);
    expect(confirmSpy.calledOnce).to.be.true;
    expect(recursiveQuery(modal, 'sp-dialog-wrapper')).to.be.undefined;
  });

  describe('destructive modal', () => {
    beforeEach(async () => {
      sidekick = new AEMSidekick(defaultSidekickConfig);
      document.body.appendChild(sidekick);
      await waitUntil(() => recursiveQuery(sidekick, 'action-bar-picker'));
    });

    it('default text', async () => {
      appStore.showModal({
        type: MODALS.DELETE,
      });

      const modal = recursiveQuery(sidekick, 'modal-container');
      await waitUntil(() => recursiveQuery(modal, 'sp-dialog-wrapper'));

      const dialogWrapper = recursiveQuery(modal, 'sp-dialog-wrapper');
      expect(dialogWrapper.getAttribute('open')).to.equal('');

      const dialogHeading = recursiveQuery(dialogWrapper, 'h2');
      expect(dialogHeading.textContent.trim()).to.eq('Are you sure you want to delete this?');
      expect(dialogWrapper.querySelector('.prompt').textContent).to.eq('Type DELETE to confirm');
    });

    it('with action', async () => {
      appStore.showModal({
        type: MODALS.DELETE,
        data: {
          action: 'unpublish',
        },
      });

      const modal = recursiveQuery(sidekick, 'modal-container');
      await waitUntil(() => recursiveQuery(modal, 'sp-dialog-wrapper'));

      const dialogWrapper = recursiveQuery(modal, 'sp-dialog-wrapper');
      expect(dialogWrapper.getAttribute('open')).to.equal('');

      const dialogHeading = recursiveQuery(dialogWrapper, 'h2');
      expect(dialogHeading.textContent.trim()).to.eq('Are you sure you want to unpublish this?');
      expect(dialogWrapper.querySelector('.prompt').textContent).to.eq('Type UNPUBLISH to confirm');
    });

    it('confirmed', async () => {
      appStore.showModal({
        type: MODALS.DELETE,
      });

      const confirmSpy = sandbox.spy();
      const cancelSpy = sandbox.spy();
      const modal = recursiveQuery(sidekick, 'modal-container');
      modal.addEventListener('confirm', confirmSpy);
      modal.addEventListener('cancelled', cancelSpy);

      await waitUntil(() => recursiveQuery(modal, 'sp-dialog-wrapper'));

      const dialogWrapper = recursiveQuery(modal, 'sp-dialog-wrapper');
      expect(dialogWrapper.getAttribute('open')).to.equal('');
      const confirmButton = recursiveQuery(dialogWrapper, 'sp-button[variant="negative"]');
      expect(confirmButton).to.exist;

      // To try to confirm without the correct text
      confirmButton.click();

      expect(dialogWrapper.querySelector('.delete-input.invalid')).to.exist;
      expect(confirmSpy.calledOnce).to.be.false;
      expect(cancelSpy.calledOnce).to.be.false;

      const input = dialogWrapper.querySelector('sp-textfield');
      input.value = 'DELETE';

      // Confirm with the correct text
      confirmButton.click();

      expect(confirmSpy.calledOnce).to.be.true;
      expect(cancelSpy.calledOnce).to.be.false;

      await aTimeout(100);
      expect(recursiveQuery(modal, 'sp-dialog-wrapper')).to.be.undefined;
    });

    it('confirmed with enter key', async () => {
      appStore.showModal({
        type: MODALS.DELETE,
      });

      const confirmSpy = sandbox.spy();
      const cancelSpy = sandbox.spy();
      const modal = recursiveQuery(sidekick, 'modal-container');
      modal.addEventListener('confirm', confirmSpy);
      modal.addEventListener('cancelled', cancelSpy);

      await waitUntil(() => recursiveQuery(modal, 'sp-dialog-wrapper'));

      const dialogWrapper = recursiveQuery(modal, 'sp-dialog-wrapper');
      expect(dialogWrapper.getAttribute('open')).to.equal('');

      const event = new KeyboardEvent('keyup', {
        key: 'Enter',
      });
      // To try to confirm without the correct text
      document.dispatchEvent(event);

      expect(dialogWrapper.querySelector('.delete-input.invalid')).to.exist;
      expect(confirmSpy.calledOnce).to.be.false;
      expect(cancelSpy.calledOnce).to.be.false;

      const input = dialogWrapper.querySelector('sp-textfield');
      input.value = 'DELETE';

      // Confirm with the correct text
      document.dispatchEvent(event);

      expect(confirmSpy.calledOnce).to.be.true;
      expect(cancelSpy.calledOnce).to.be.false;

      await aTimeout(100);
      expect(recursiveQuery(modal, 'sp-dialog-wrapper')).to.be.undefined;
    });

    it('cancelled', async () => {
      appStore.showModal({
        type: MODALS.DELETE,
      });

      const confirmSpy = sandbox.spy();
      const cancelSpy = sandbox.spy();
      const modal = recursiveQuery(sidekick, 'modal-container');
      modal.addEventListener(MODAL_EVENTS.CONFIRM, confirmSpy);
      modal.addEventListener(MODAL_EVENTS.CANCEL, cancelSpy);

      await waitUntil(() => recursiveQuery(modal, 'sp-dialog-wrapper'));

      const dialogWrapper = recursiveQuery(modal, 'sp-dialog-wrapper');
      expect(dialogWrapper.getAttribute('open')).to.equal('');
      const cancelButton = recursiveQuery(dialogWrapper, 'sp-button[variant="secondary"]');
      expect(cancelButton).to.exist;
      cancelButton.click();

      await aTimeout(100);
      expect(confirmSpy.calledOnce).to.be.false;
      expect(cancelSpy.calledOnce).to.be.true;
      expect(recursiveQuery(modal, 'sp-dialog-wrapper')).to.be.undefined;
    });

    it('cancelled with esc key', async () => {
      appStore.showModal({
        type: MODALS.DELETE,
      });

      const confirmSpy = sandbox.spy();
      const cancelSpy = sandbox.spy();
      const modal = recursiveQuery(sidekick, 'modal-container');
      modal.addEventListener(MODAL_EVENTS.CONFIRM, confirmSpy);
      modal.addEventListener(MODAL_EVENTS.CANCEL, cancelSpy);

      await waitUntil(() => recursiveQuery(modal, 'sp-dialog-wrapper'));

      const dialogWrapper = recursiveQuery(modal, 'sp-dialog-wrapper');
      expect(dialogWrapper.getAttribute('open')).to.equal('');

      const event = new KeyboardEvent('keyup', {
        key: 'Escape',
      });
      document.dispatchEvent(event);

      await aTimeout(100);
      expect(confirmSpy.calledOnce).to.be.false;
      expect(cancelSpy.calledOnce).to.be.true;
      expect(recursiveQuery(modal, 'sp-dialog-wrapper')).to.be.undefined;
    });
  });

  it('displays error modal - default headline', async () => {
    sidekick = new AEMSidekick(defaultSidekickConfig);
    document.body.appendChild(sidekick);

    await waitUntil(() => recursiveQuery(sidekick, 'action-bar-picker'));
    appStore.showModal({
      type: MODALS.ERROR,
      data: {
        message: 'There was an error',
      },
    });

    const modal = recursiveQuery(sidekick, 'modal-container');
    await waitUntil(() => recursiveQuery(modal, 'sp-dialog-wrapper'));
    const dialogWrapper = recursiveQuery(modal, 'sp-dialog-wrapper');

    expect(dialogWrapper.getAttribute('open')).to.equal('');

    const dialogHeading = recursiveQuery(dialogWrapper, 'h2');
    expect(dialogHeading.textContent.trim()).to.eq('Error');
  });

  it('ignores unknown modal type', async () => {
    sidekick = new AEMSidekick(defaultSidekickConfig);
    document.body.appendChild(sidekick);

    await waitUntil(() => recursiveQuery(sidekick, 'action-bar-picker'));
    appStore.showModal({
      type: 'unknown-type',
      data: {
        message: 'test',
      },
    });

    await aTimeout(100);
    expect(recursiveQuery(sidekick, 'modal-container')).to.be.undefined;
  });
});
