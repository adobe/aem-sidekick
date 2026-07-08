/*
 * Copyright 2026 Adobe. All rights reserved.
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
import { setUserAgent } from '@web/test-runner-commands';
import sinon from 'sinon';

import chromeMock from './mocks/chrome.js';
import { showLoginHint } from '../src/extension/login-hint.js';

// @ts-ignore
window.chrome = chromeMock;

const HINT_CLASS = 'aem-sk-login-hint';

/**
 * Adds an AEM admin error page <pre> to the body.
 * @param {string} text The error text
 * @returns {HTMLElement} The pre element
 */
function addErrorPre(text) {
  const pre = document.createElement('pre');
  pre.textContent = text;
  document.body.appendChild(pre);
  return pre;
}

const getHint = () => document.querySelector(`.${HINT_CLASS}`);
const getLink = () => document.querySelector(`.${HINT_CLASS} a`);

describe('Test login hint', () => {
  const sandbox = sinon.createSandbox();

  before(async () => {
    await setUserAgent('HeadlessChrome');
  });

  afterEach(() => {
    document.querySelectorAll('body > pre').forEach((el) => el.remove());
    sandbox.restore();
  });

  it('appends a sign-in link on a 401 error page', () => {
    const pre = addErrorPre('401 Unauthorized');
    showLoginHint();
    expect(getHint()).to.exist;
    expect(getLink().textContent).to.equal('i18n?login_hint_401');
    // link lives inside the error <pre>
    expect(pre.contains(getHint())).to.be.true;
  });

  it('uses the forbidden message on a 403 error page', () => {
    addErrorPre('403 Forbidden');
    showLoginHint();
    expect(getLink().textContent).to.equal('i18n?login_hint_403');
  });

  it('does not show a hint when there is no error page', () => {
    showLoginHint();
    expect(getHint()).to.not.exist;
  });

  it('does not show a hint for an unrelated pre', () => {
    addErrorPre('some other content');
    showLoginHint();
    expect(getHint()).to.not.exist;
  });

  it('does not append a second link', () => {
    addErrorPre('401 Unauthorized');
    showLoginHint();
    showLoginHint();
    expect(document.querySelectorAll(`.${HINT_CLASS}`).length).to.equal(1);
  });

  it('restores the pristine error page and shows the sidekick when clicked', () => {
    const spy = sandbox.spy(chrome.storage.local, 'set');
    const pre = addErrorPre('401 Unauthorized');
    showLoginHint();
    getLink().click();
    // link removed before toggling so the error page is detectable again
    expect(getHint()).to.not.exist;
    expect(pre.textContent.trim()).to.equal('401 Unauthorized');
    expect(spy.calledWith({ display: true })).to.be.true;
  });

  it('removes the hint when the sidekick is shown another way', () => {
    addErrorPre('401 Unauthorized');
    showLoginHint();
    expect(getHint()).to.exist;

    const fire = (changes, area) => chrome.storage.onChanged.listeners
      .forEach((l) => l(changes, area));

    // unrelated changes leave the hint in place
    fire({ display: { newValue: false } }, 'local');
    fire({ theme: { newValue: 'light' } }, 'sync');
    expect(getHint()).to.exist;

    // showing the sidekick removes it
    fire({ display: { newValue: true } }, 'local');
    expect(getHint()).to.not.exist;
  });

  it('reappears after being shown on a later error page', () => {
    const pre = addErrorPre('401 Unauthorized');
    showLoginHint();
    getHint().remove();
    expect(getHint()).to.not.exist;

    // detection succeeds again on the pristine page
    expect(pre.textContent.trim()).to.equal('401 Unauthorized');
    showLoginHint();
    expect(getHint()).to.exist;
  });
});
