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
import { EVENTS } from '../../../../src/extension/app/constants.js';
import chromeMock from '../../../mocks/chrome.js';
import '../../../../src/extension/index.js';
import { recursiveQuery, recursiveQueryAll } from '../../../test-utils.js';

// @ts-ignore
window.chrome = chromeMock;

/**
 * @typedef {import('../../../../src/extension/app/components/toast/toast-container.js').ToastContainer} ToastContainer
 */

describe('Toasts', () => {
  it('renders wait modal and closes', async () => {
    const element = await fixture(html`<theme-wrapper><toast-container></toast-container></theme-wrapper>`);
    EventBus.instance.dispatchEvent(new CustomEvent(EVENTS.SHOW_TOAST, {
      detail: {
        message: 'Test Toast',
        variant: 'info',
      },
    }));

    /**
     * @type {ToastContainer}
     */
    const ToastContainer = element.querySelector('toast-container');

    await waitUntil(() => recursiveQuery(ToastContainer, 'sp-toast'));

    const toast = recursiveQuery(ToastContainer, 'sp-toast');
    expect(toast).to.exist;
    expect(toast.textContent).to.equal('Test Toast');
    expect(toast.getAttribute('variant')).to.equal('info');

    const closeButton = recursiveQuery(toast, 'sp-close-button');
    expect(closeButton).to.exist;
    closeButton.click();

    await aTimeout(1);
    expect(recursiveQuery(ToastContainer, 'sp-toast')).to.be.undefined;
  });

  it('renders 1 toast at a time', async () => {
    const element = await fixture(html`<theme-wrapper><toast-container></toast-container></theme-wrapper>`);
    EventBus.instance.dispatchEvent(new CustomEvent(EVENTS.SHOW_TOAST, {
      detail: {
        message: 'Test Toast',
        variant: 'info',
      },
    }));

    EventBus.instance.dispatchEvent(new CustomEvent(EVENTS.SHOW_TOAST, {
      detail: {
        message: 'Test Toast',
        variant: 'info',
      },
    }));

    /**
     * @type {ToastContainer}
     */
    const ToastContainer = element.querySelector('toast-container');

    await waitUntil(() => recursiveQuery(ToastContainer, 'sp-toast'));

    const toasts = [...recursiveQueryAll(ToastContainer, 'sp-toast')];
    expect(toasts.length).to.equal(1);
  });
});
