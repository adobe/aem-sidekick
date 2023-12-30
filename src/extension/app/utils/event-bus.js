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

/* eslint-disable no-underscore-dangle, no-constructor-return */

/**
  * @typedef {Object} EventListener
  * @property {string} type Event type
  * @property {Function} callback Callback function
  */

/**
 * Event bus class
 * @class EventBus
 */
export class EventBus {
  /**
   * List of event listeners.
   * @type {EventListener[]}
   */
  listeners = [];

  /**
   * Singleton instance.
   */
  static _instance;

  /**
   * Get singleton instance.
   */
  static get instance() {
    if (!EventBus._instance) {
      EventBus._instance = new EventBus();
    }
    return EventBus._instance;
  }

  constructor() {
    if (!EventBus._instance) {
      EventBus._instance = this;
    }
    return EventBus._instance;
  }

  /**
   * Add event listener.
   * @param {string} type Event type
   * @param {Function} callback Callback function
   * @returns {EventListener} Event listener
   */
  addEventListener(type, callback) {
    const listener = { type, callback };
    this.listeners.push(listener);
    return listener;
  }

  /**
   * Remove event listener.
   * @param {EventListener} listenerToRemove Event listener to remove.
   */
  removeEventListener(listenerToRemove) {
    for (const [index, listener] of this.listeners.entries()) {
      if (listener === listenerToRemove) {
        this.listeners.splice(index, 1);
        return;
      }
    }
  }

  /**
   * Remove event listeners
   * @param {EventListener[]} listeners List of event listeners to remove.
   */
  removeEventListeners(listeners) {
    listeners.forEach((listener) => {
      this.removeEventListener(listener);
    });
  }

  /**
   * Dispatch event
   * @param {CustomEvent} event Event to dispatch.
   */
  dispatchEvent(event) {
    const listeners = this.listeners.slice();
    listeners.forEach((listener) => {
      if (event.type === listener.type) {
        listener.callback.apply(this, [event]);
      }
    });
  }
}
