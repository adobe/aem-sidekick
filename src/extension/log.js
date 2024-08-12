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

/*
 * Based on easingthemes' original contribution under the Apache 2.0 license:
 * https://github.com/adobe/helix-sidekick-extension/pull/642
 */

class Logger {
  /**
   * @member {Function} debug The debug method (only logs if LEVEL is 3 or higher)
   * @param {...any} _ The arguments to log
   */
  debug;

  /**
   * @member {Function} info The info method (only logs if LEVEL is 2 or higher)
   * @param {...any} _ The arguments to log
   */
  info;

  /**
   * @member {Function} warn The warn method (only logs if LEVEL is 1 or higher)
   * @param {...any} _ The arguments to log
   */
  warn;

  /**
   * @member {Function} error The error method (always logs)
   * @param {...any} _ The arguments to log
   */
  error;

  /**
   * Logs messages to the console depending on severity and log level.
   * @class
   * @constructor
   * @param {number} [level=0] The log level
   */
  constructor(level = 3) {
    /**
     * @member {number} LEVEL The log level (0 = error, 1 = warn, 2 = info, 3 = debug)
     */
    this.__LEVEL = level;
    this.config = {
      debug: { level: 3, color: 'grey' },
      info: { level: 2, color: '' },
      warn: { level: 1, color: 'orange' },
      error: { level: 0, color: 'red' },
    };
    this.createMethods();
  }

  get LEVEL() {
    return this.__LEVEL;
  }

  set LEVEL(level) {
    this.__LEVEL = level;
    this.createMethods();
  }

  createMethods() {
    Object.keys(this.config).forEach((method) => {
      const color = `color: ${this.config[method].color}`;
      const prefix = `%c[${method.toUpperCase()}]`;
      this[method] = this.LEVEL > this.config[method].level
        // eslint-disable-next-line no-console
        ? console[method].bind(console, prefix, color)
        : () => {};
    });
  }
}

export const log = new Logger();
