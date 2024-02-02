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
import { html } from 'lit';
import {
  fixture, expect, waitUntil, aTimeout,
} from '@open-wc/testing';
import { EventBus } from '../../../../src/extension/app/utils/event-bus.js';
import { EVENTS, MODALS } from '../../../../src/extension/app/constants.js';
import chromeMock from '../../../mocks/chrome.js';
import '../../../../src/extension/index.js';
import { recursiveQuery } from '../../../test-utils.js';
import { mockFetchEnglishMessagesSuccess } from '../../../mocks/i18n.js';
import { appStore } from '../../../../src/extension/app/store/app.js';
import { fetchLanguageDict } from '../../../../src/extension/app/utils/i18n.js';

// @ts-ignore
window.chrome = chromeMock;

/**
 * @typedef {import('../../../../../src/extension/app/components/modal/modal-container.js').ModalContainer} ModalContainer
 */

describe('Modals', () => {
  beforeEach(async () => {
    mockFetchEnglishMessagesSuccess();
    appStore.languageDict = await fetchLanguageDict(undefined, 'en');
  });

  it('renders wait modal and closes', async () => {
    const element = await fixture(html`<theme-wrapper><modal-container></modal-container></theme-wrapper>`);

    /**
     * @type {ModalContainer}
     */
    const modal = element.querySelector('modal-container');

    EventBus.instance.dispatchEvent(new CustomEvent(EVENTS.OPEN_MODAL, {
      detail: {
        type: MODALS.WAIT,
        data: {
          message: 'test',
        },
      },
    }));

    await waitUntil(() => recursiveQuery(modal, 'dialog-view'));
    const dialogView = recursiveQuery(modal, 'dialog-view');
    const dialogWrapper = recursiveQuery(dialogView, 'sp-dialog-wrapper');

    expect(dialogWrapper.getAttribute('open')).to.equal('');

    EventBus.instance.dispatchEvent(new CustomEvent(EVENTS.CLOSE_MODAL));

    expect(modal.modal).to.be.undefined;
  });

  it('displays error modal', async () => {
    const element = await fixture(html`<theme-wrapper><modal-container></modal-container></theme-wrapper>`);
    const modal = element.querySelector('modal-container');

    EventBus.instance.dispatchEvent(new CustomEvent(EVENTS.OPEN_MODAL, {
      detail: {
        type: MODALS.ERROR,
        data: {
          message: 'There was an error',
          headline: 'Oh snap',
        },
      },
    }));

    await waitUntil(() => recursiveQuery(modal, 'dialog-view'));
    const dialogView = recursiveQuery(modal, 'dialog-view');
    const dialogWrapper = recursiveQuery(dialogView, 'sp-dialog-wrapper');

    expect(dialogWrapper.getAttribute('open')).to.equal('');

    const dialogHeading = recursiveQuery(dialogWrapper, 'h2');
    expect(dialogHeading.textContent.trim()).to.eq('Oh snap');

    expect(dialogView.textContent.trim()).to.eq('There was an error');

    const okButton = recursiveQuery(dialogView, 'sp-button');
    expect(okButton).to.exist;
    okButton.dispatchEvent(new Event('click'));

    await aTimeout(100);
    expect(recursiveQuery(modal, 'dialog-view')).to.be.undefined;
  });

  it('displays error modal - default headline', async () => {
    const element = await fixture(html`<theme-wrapper><modal-container></modal-container></theme-wrapper>`);
    const modal = element.querySelector('modal-container');

    EventBus.instance.dispatchEvent(new CustomEvent(EVENTS.OPEN_MODAL, {
      detail: {
        type: MODALS.ERROR,
        data: {
          message: 'There was an error',
        },
      },
    }));

    await waitUntil(() => recursiveQuery(modal, 'dialog-view'));
    const dialogView = recursiveQuery(modal, 'dialog-view');
    const dialogWrapper = recursiveQuery(dialogView, 'sp-dialog-wrapper');

    expect(dialogWrapper.getAttribute('open')).to.equal('');

    const dialogHeading = recursiveQuery(dialogWrapper, 'h2');
    expect(dialogHeading.textContent.trim()).to.eq('Error');
  });

  it('ignores unknown modal type', async () => {
    const element = await fixture(html`<theme-wrapper><modal-container></modal-container></theme-wrapper>`);
    const modal = element.querySelector('modal-container');

    EventBus.instance.dispatchEvent(new CustomEvent(EVENTS.OPEN_MODAL, {
      detail: {
        type: 'unknown-type',
        data: {
          message: 'test',
        },
      },
    }));

    expect(recursiveQuery(modal, 'dialog-view')).to.be.undefined;
  });
});
