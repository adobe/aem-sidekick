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
import sinon from 'sinon';

import { addCacheBusterRule, getHostDomain } from '../src/extension/cache-buster.js';
import chromeMock from './mocks/chrome.js';
import { log } from '../src/extension/log.js';

// @ts-ignore
window.chrome = chromeMock;

describe('cache-buster', () => {
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    sandbox.restore();
  });

  describe('getHostDomain', () => {
    it('returns empty string for null or undefined', () => {
      expect(getHostDomain(null)).to.equal('');
      expect(getHostDomain(undefined)).to.equal('');
    });

    it('returns empty string for empty or whitespace-only string', () => {
      expect(getHostDomain('')).to.equal('');
      expect(getHostDomain('   ')).to.equal('');
    });

    it('returns hostname for full URL', () => {
      expect(getHostDomain('https://example.com/path')).to.equal('example.com');
      expect(getHostDomain('https://sub.example.com:443/')).to.equal('sub.example.com');
      expect(getHostDomain('http://foo.com')).to.equal('foo.com');
    });

    it('returns input for plain domain', () => {
      expect(getHostDomain('example.com')).to.equal('example.com');
      expect(getHostDomain('main--repo--owner.aem.live')).to.equal('main--repo--owner.aem.live');
    });

    it('trims whitespace', () => {
      expect(getHostDomain('  example.com  ')).to.equal('example.com');
    });
  });

  describe('addCacheBusterRule', () => {
    it('returns false and warns when domain is empty after getHostDomain', async () => {
      const logWarn = sandbox.stub(log, 'warn');
      expect(await addCacheBusterRule('')).to.equal(false);
      expect(await addCacheBusterRule('   ')).to.equal(false);
      expect(logWarn.calledWith('addCacheBusterRule: no domain')).to.be.true;
    });

    it('returns false and warns when domain is null or undefined', async () => {
      const logWarn = sandbox.stub(log, 'warn');
      expect(await addCacheBusterRule(null)).to.equal(false);
      expect(await addCacheBusterRule(undefined)).to.equal(false);
      expect(logWarn.calledWith('addCacheBusterRule: no domain')).to.be.true;
    });

    it('adds rule and schedules removal after 10s', async () => {
      const clock = sandbox.useFakeTimers();
      const updateSessionRules = sandbox.stub(chrome.declarativeNetRequest, 'updateSessionRules').resolves();

      const result = await addCacheBusterRule('example.com');

      expect(result).to.equal(true);
      expect(updateSessionRules.calledTwice).to.be.false;
      expect(updateSessionRules.calledOnce).to.be.true;
      const [firstCall] = updateSessionRules.args;
      expect(firstCall[0]).to.have.property('addRules');
      expect(firstCall[0].addRules).to.have.lengthOf(1);
      const rule = firstCall[0].addRules[0];
      expect(rule).to.have.property('id');
      expect(rule.priority).to.equal(1);
      expect(rule.action.type).to.equal('modifyHeaders');
      expect(rule.action.requestHeaders).to.deep.include(
        { operation: 'set', header: 'Cache-Control', value: 'no-cache' },
      );
      expect(rule.action.requestHeaders).to.deep.include(
        { operation: 'set', header: 'Pragma', value: 'no-cache' },
      );
      expect(rule.condition.regexFilter).to.equal('^https://example\\.com/.*');
      expect(rule.condition.requestMethods).to.deep.equal(['get']);

      clock.tick(10 * 1000);
      expect(updateSessionRules.calledTwice).to.be.true;
      const removeCall = updateSessionRules.getCall(1).args[0];
      expect(removeCall).to.have.property('removeRuleIds');
      expect(removeCall.removeRuleIds).to.deep.equal([rule.id]);
    });

    it('accepts full URL and uses hostname', async () => {
      const updateSessionRules = sandbox.stub(chrome.declarativeNetRequest, 'updateSessionRules').resolves();

      const result = await addCacheBusterRule('https://my.site.com/path');

      expect(result).to.equal(true);
      const rule = updateSessionRules.firstCall.args[0].addRules[0];
      expect(rule.condition.regexFilter).to.equal('^https://my\\.site\\.com/.*');
    });
  });
});
