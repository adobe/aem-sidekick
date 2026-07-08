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

import { setDisplay } from './display.js';
import { isErrorPage } from './utils/error.js';

/**
 * Class name of the login hint element appended to the error page.
 * @type {string}
 */
const HINT_CLASS = 'aem-sk-login-hint';

/**
 * Detects a pipeline auth error page and returns its status.
 * @returns {(401|403|null)} The error status, or null if not a login-related error page
 */
function getErrorStatus() {
  if (!isErrorPage(window.location, document)) {
    return null;
  }
  const text = document.querySelector('body > pre').textContent.trim();
  if (text === '401 Unauthorized') {
    return 401;
  }
  if (text === '403 Forbidden') {
    return 403;
  }
  return null;
}

/**
 * Removes the login hint from the DOM if present, restoring the pristine
 * error page so its status can be detected again.
 */
function removeHint() {
  document.querySelector(`.${HINT_CLASS}`)?.remove();
}

let cleanupRegistered = false;

/**
 * Removes the hint once the sidekick is shown (e.g. via the extension icon),
 * so the injected link never lingers on the error page and does not interfere
 * with the sidekick's own error-page detection.
 */
function registerUnhideCleanup() {
  if (cleanupRegistered) {
    return;
  }
  cleanupRegistered = true;
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.display?.newValue === true) {
      removeHint();
    }
  });
}

/**
 * Appends a "sign in" hyperlink to the pipeline 401/403 auth error message when the
 * sidekick is hidden. Clicking it removes the injected link (restoring the
 * pristine error page) and shows the sidekick, which then renders the login
 * dialog for this error page.
 */
export function showLoginHint() {
  const status = getErrorStatus();
  if (!status || document.querySelector(`.${HINT_CLASS}`)) {
    return;
  }

  const hint = document.createElement('span');
  hint.className = HINT_CLASS;
  hint.append(' — ');

  const link = document.createElement('a');
  link.href = '#';
  link.textContent = chrome.i18n.getMessage(
    status === 403 ? 'login_hint_403' : 'login_hint_401',
  );
  link.addEventListener('click', (e) => {
    e.preventDefault();
    // restore the pristine error page before toggling so the sidekick can
    // detect the 401/403 and render the login dialog
    removeHint();
    setDisplay(true);
  });
  hint.append(link);

  registerUnhideCleanup();
  document.querySelector('body > pre').append(hint);
}
