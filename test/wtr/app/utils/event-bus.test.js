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
import sinon from 'sinon';
import { EventBus } from '../../../../src/extension/app/utils/event-bus.js';

describe('EventBus', () => {
  let eventBus;

  before(() => {
    eventBus = EventBus.instance;
  });

  it('should be a singleton', () => {
    const anotherInstance = EventBus.instance;
    expect(eventBus).to.equal(anotherInstance);
  });

  it('should add event listeners', () => {
    const callback = sinon.spy();
    eventBus.addEventListener('test-event', callback);
    expect(eventBus.listeners).to.deep.include({ type: 'test-event', callback });
  });

  it('should remove a specific event listener', () => {
    const callback = sinon.spy();
    const listener = eventBus.addEventListener('test-remove', callback);
    eventBus.removeEventListener(listener);
    expect(eventBus.listeners).to.not.deep.include(listener);
  });

  it('should remove multiple event listeners', () => {
    const callbacks = [sinon.spy(), sinon.spy()];
    const listeners = callbacks.map((cb) => eventBus.addEventListener('multi-remove', cb));
    eventBus.removeEventListeners(listeners);
    listeners.forEach((listener) => {
      expect(eventBus.listeners).to.not.deep.include(listener);
    });
  });

  it('should call the correct listener on event dispatch', () => {
    const callback = sinon.spy();
    eventBus.addEventListener('dispatch-event', callback);
    eventBus.dispatchEvent(new CustomEvent('dispatch-event'));
    sinon.assert.calledOnce(callback);
  });

  it('should not call any listener when no matching event', () => {
    const callback = sinon.spy();
    eventBus.addEventListener('no-call-event', callback);
    eventBus.dispatchEvent(new CustomEvent('other-event'));
    sinon.assert.notCalled(callback);
  });

  afterEach(() => {
    // Reset the event listeners after each test
    eventBus.listeners = [];
  });
});
