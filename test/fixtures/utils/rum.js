/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { error } from '../../test-utils.js';

/**
 * Log RUM for sidekick telemetry (dummy)
 * @private
 * @param {string} checkpoint identifies the checkpoint in funnel
 * @param {Object} data additional data for RUM sample
 */
export default function sampleRUM(checkpoint, data = {}) {
  // eslint-disable-next-line no-console
  console.log('sampleRUM', checkpoint, data);
  if (checkpoint === 'sidekick:context-menu:openViewDocSource') {
    // test error handling
    throw error;
  }
}
