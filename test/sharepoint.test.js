/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
/* eslint-disable no-unused-expressions */

import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import { wordHelper } from '../src/extension/sharepoint.js';
import chromeMock from './mocks/chrome.js';

// @ts-ignore
window.chrome = chromeMock;

const sandbox = sinon.createSandbox();

const mockSender = {
  id: chrome.runtime.id,
};
const mockUrl = 'https://foo.sharepoint.com/:w:/r/sites/foo/_layouts/15/Doc.aspx?sourcedoc=%7BBFD9A19C-4A68-4DBF-8641-DA2F1283C895%7D&file=bla.docx&action=default&mobileredirect=true';

describe('sharepoint helper', () => {
  /**
   * @type {Window}
   */
  let mockWindow;
  let listenerAdded;
  let addListenerStub;
  let sendResponse;
  let dispatchEventStub;

  beforeEach(() => {
    mockWindow = {
      // @ts-ignore
      location: {
        origin: 'https://word-edit.officeapps.live.com',
      },
    };
    addListenerStub = sandbox.stub(chrome.runtime.onMessage, 'addListener');
    addListenerStub.callsFake((listener) => {
      listenerAdded = listener;
    });
    sendResponse = sandbox.stub();
    dispatchEventStub = sandbox.stub(document, 'dispatchEvent');
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('adds message listener to word editor frame and saves document', async () => {
    wordHelper(
      chrome.runtime.id,
      mockUrl,
      mockWindow,
    );
    expect(listenerAdded).to.be.a('function');

    // trigger the message listener
    const message = {
      action: 'saveDocument',
      url: mockUrl,
    };
    // @ts-ignore
    await listenerAdded(message, mockSender, sendResponse);

    expect(dispatchEventStub.calledWithMatch({ key: 's' })).to.be.true;
    expect(sendResponse.calledWith(true)).to.be.true;
  });

  it('only adds message listener once', async () => {
    wordHelper(
      chrome.runtime.id,
      mockUrl,
      {
        ...mockWindow,
        hlx: {
          previewListenerAdded: true,
        },
      },
    );
    expect(addListenerStub.called).to.be.false;
  });

  it('only reacts to save messages from the same tab', async () => {
    wordHelper(
      chrome.runtime.id,
      mockUrl,
      mockWindow,
    );
    expect(addListenerStub.called).to.be.true;

    // send an unrelated message to the tab
    const message = {
      action: 'somethingElse',
    };
    // @ts-ignore
    await listenerAdded(message, mockSender, sendResponse);

    expect(sendResponse.calledWith(false)).to.be.true;
  });
});
