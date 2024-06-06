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

import { html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { ConnectedElement } from '../../connected-element/connected-element.js';
import { ICONS } from '../../../constants.js';
import { style } from './bulk-result.css.js';

@customElement('bulk-result')
export class BulkResult extends ConnectedElement {
  static get styles() {
    return [style];
  }

  /**
   * Render the bulk results.
   */
  render() {
    const { summary } = this.appStore.bulkStore || {};

    return summary ? html`
      <div class="container">
        ${summary.resources.map(({ status, path, error }) => html`
          <div class="resource">
            <div class="status ${status < 400 ? 'success' : 'error'}">
              ${status < 400 ? ICONS.CHECKMARK : ICONS.ALERT_TRIANGLE}
            </div>
            <div>
              <div class="path">
                ${status < 400
                  ? html`<a href="https://${summary.host}${path}" target="_blank">${path}</a>`
                  : path}
              </div>
              <div class="error">
                ${error
                  ? html`
                    <span>
                      ${this.appStore.api.getLocalizedError(summary.operation, status, error)}
                    </span>
                  `
                  : ''}
              </div>
            </div>
          </div>
          <sp-menu-divider></sp-menu-divider>
        `)}
      </div>
    ` : '';
  }
}
