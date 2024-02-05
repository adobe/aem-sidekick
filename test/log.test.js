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

import { expect } from '@open-wc/testing';
import { setUserAgent } from '@web/test-runner-commands';
import sinon from 'sinon';

describe('Test log', () => {
  let log;
  let consoleSpy;
  const sandbox = sinon.createSandbox();

  before(async () => {
    // console spy needs to be called before console.bind in log
    consoleSpy = sandbox.spy(console);
    ({ log } = await import('../src/extension/log.js'));
    await setUserAgent('HeadlessChrome');
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('log', async () => {
    // Default log Level is 2
    log.warn('foo');
    expect(typeof log.warn).to.equal('function');
    expect(consoleSpy.warn.callCount).to.equal(1);
    expect(consoleSpy.warn.getCall(0).args[0]).to.include('[WARN]');
    expect(consoleSpy.warn.getCall(0).args[1]).to.include('color: orange');
    expect(consoleSpy.warn.calledWith('%c[WARN]', 'color: orange', 'foo')).to.equal(true);

    log.error('foo');
    expect(typeof log.error).to.equal('function');
    expect(consoleSpy.error.callCount).to.equal(1);
    expect(consoleSpy.error.getCall(0).args[0]).to.include('[ERROR]');
    expect(consoleSpy.error.getCall(0).args[1]).to.include('color: red');
    expect(consoleSpy.error.calledWith('%c[ERROR]', 'color: red', 'foo')).to.equal(true);

    // Should not log messages below the log level 2
    log.debug('foo');
    log.info('foo');
    expect(consoleSpy.debug.callCount).to.equal(0);
    expect(consoleSpy.info.callCount).to.equal(0);

    // Should not log messages below the log level 1
    log.LEVEL = 1;
    log.warn('level 1');
    // 1 callCount is from previous log
    expect(consoleSpy.warn.callCount).to.equal(1);
    log.LEVEL = 6;
    log.warn('level 3');
    expect(consoleSpy.warn.callCount).to.equal(2);
    // reset level to default
    log.LEVEL = 2;
  });
});
