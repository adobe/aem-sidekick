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
/* eslint-disable no-unused-expressions, import/no-extraneous-dependencies */

import {
  expect, fixture, html, waitUntil,
} from '@open-wc/testing';
// @ts-ignore
import fetchMock from 'fetch-mock/esm/client.js';
import sinon from 'sinon';
import chromeMock from '../../mocks/chrome.js';
import { recursiveQuery } from '../../test-utils.js';
import { englishMessagesUrl } from '../../sidekick-test.js';
import enMessages from '../../../src/extension/_locales/en/messages.json' with { type: 'json' };
import { getConfig } from '../../../src/extension/config.js';
import '../../../src/extension/views/login/login.js';

// @ts-ignore
window.chrome = chromeMock;

describe('Login View', () => {
  beforeEach(() => {
    chromeMock.storage.local.clear();
    fetchMock.get(englishMessagesUrl, { status: 200, body: enMessages }, { overwriteRoutes: true });
  });

  afterEach(() => {
    fetchMock.reset();
    sinon.restore();
  });

  async function mountView() {
    const el = /** @type {import('../../../src/extension/views/login/login.js').LoginView} */ (
      await fixture(html`<login-view></login-view>`)
    );
    await waitUntil(() => el.heading, 'view did not initialize');
    await el.updateComplete;
    return el;
  }

  it('renders the dialog', async () => {
    const el = await mountView();
    expect(recursiveQuery(el, 'sp-button#login')).to.exist;
    expect(recursiveQuery(el, 'sp-checkbox')).to.exist;
    expect(recursiveQuery(el, 'sp-icon#login-hint')).to.exist;
  });

  it('posts login without account selection on a normal click', async () => {
    const el = await mountView();
    const postSpy = sinon.spy(window.parent, 'postMessage');
    el.onClicked({ altKey: false });
    expect(postSpy.calledOnce).to.be.true;
    const { detail } = postSpy.firstCall.args[0];
    expect(detail.event).to.equal('hlx-login');
    expect(detail.selectAccount).to.be.false;
  });

  it('selects an account when the alt key is held', async () => {
    const el = await mountView();
    const postSpy = sinon.spy(window.parent, 'postMessage');
    el.onClicked({ altKey: true });
    expect(postSpy.firstCall.args[0].detail.selectAccount).to.be.true;
  });

  it('selects an account on a 403 click', async () => {
    const el = await mountView();
    el.status = '403';
    const postSpy = sinon.spy(window.parent, 'postMessage');
    el.onClicked({ altKey: false });
    expect(postSpy.firstCall.args[0].detail.selectAccount).to.be.true;
  });

  it('stores the auto sign-in preference per project when toggled', async () => {
    const el = await mountView();
    el.org = 'adobe';
    el.site = 'aem-boilerplate';

    el.onAutoLoginChanged({ target: { checked: true } });
    await waitUntil(async () => (await getConfig('local', 'autoLogin'))?.length === 1);
    expect(await getConfig('local', 'autoLogin')).to.deep.equal(['adobe/aem-boilerplate']);

    el.onAutoLoginChanged({ target: { checked: false } });
    await waitUntil(async () => (await getConfig('local', 'autoLogin')) === undefined);
  });

  it('auto signs in on 401 when opted in, keeping the dialog hidden', async () => {
    const el = await mountView();
    el.status = '401';
    el.org = 'adobe';
    el.site = 'aem-boilerplate';
    el.autoLogin = true;
    const postSpy = sinon.spy(window.parent, 'postMessage');

    await el.checkAutoLogin();

    // signs in
    expect(postSpy.calledOnce).to.be.true;
    expect(postSpy.firstCall.args[0].detail.event).to.equal('hlx-login');
    // records the attempt
    expect(await getConfig('local', 'autoLoginAttempt')).to.deep.equal(['adobe/aem-boilerplate']);
    // keeps the dialog hidden
    expect(el.autoLoginInProgress).to.be.true;
    await el.updateComplete;
    expect(recursiveQuery(el, 'sp-button#login')).to.not.exist;
  });

  it('records the attempt on a manual sign-in when opted in', async () => {
    const el = await mountView();
    el.status = '401';
    el.org = 'adobe';
    el.site = 'aem-boilerplate';
    el.autoLogin = true;
    const postSpy = sinon.spy(window.parent, 'postMessage');

    // manual click records the attempt
    el.onClicked({ altKey: false });
    await waitUntil(async () => (await getConfig('local', 'autoLoginAttempt'))?.length === 1);
    expect(postSpy.calledOnce).to.be.true;

    // so a following auto-login check does not sign in again, and drops the preference
    postSpy.resetHistory();
    await el.checkAutoLogin();
    expect(postSpy.notCalled).to.be.true;
    expect(await getConfig('local', 'autoLoginAttempt')).to.be.undefined;
  });

  it('stops and drops the preference if a previous attempt failed', async () => {
    chromeMock.storage.local.set({
      autoLogin: ['adobe/aem-boilerplate'],
      autoLoginAttempt: ['adobe/aem-boilerplate'],
    });

    const el = await mountView();
    el.status = '401';
    el.org = 'adobe';
    el.site = 'aem-boilerplate';
    el.autoLogin = true;
    const postSpy = sinon.spy(window.parent, 'postMessage');

    await el.checkAutoLogin();

    // does not sign in again
    expect(postSpy.notCalled).to.be.true;
    // forgets the preference and the attempt
    expect(await getConfig('local', 'autoLogin')).to.be.undefined;
    expect(await getConfig('local', 'autoLoginAttempt')).to.be.undefined;
    expect(el.autoLogin).to.be.false;
    // shows the dialog
    expect(el.autoLoginInProgress).to.be.false;
  });

  it('does not auto sign in on a 403', async () => {
    const el = await mountView();
    el.status = '403';
    el.org = 'adobe';
    el.site = 'aem-boilerplate';
    el.autoLogin = true;
    const postSpy = sinon.spy(window.parent, 'postMessage');

    await el.checkAutoLogin();

    expect(postSpy.notCalled).to.be.true;
    expect(el.autoLoginInProgress).to.be.false;
  });
});
