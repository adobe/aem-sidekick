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

/**
 * Detects an AEM error page.
 * @param {Location} location The location object
 * @param {Document} document The document object
 * @returns {boolean} True if error page
 */
export function isErrorPage(location, document) {
  return !!((location.host.endsWith('.aem.page')
    || location.host.endsWith('.aem.live')
    || location.host.endsWith('.aem.reviews')
    || location.hostname === 'localhost')
    && !document.querySelector('body > main > div')
    && document.querySelector('body > pre'));
}
