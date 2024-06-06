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
import { reaction } from 'mobx';
import { ConnectedElement } from '../../connected-element/connected-element.js';
import { style } from './bulk-info.css.js';

@customElement('bulk-info')
export class BulkInfo extends ConnectedElement {
  static get styles() {
    return [style];
  }

  /**
   * Listen for state changes
   */
  async connectedCallback() {
    super.connectedCallback();

    this.appStore.bulkStore.updateBulkSelection();

    reaction(
      () => this.appStore.bulkStore.selection,
      () => {
        this.requestUpdate();
      },
    );
  }

  render() {
    return html`
      <div class="container">
        <span>
          ${
          // eslint-disable-next-line no-nested-ternary
          this.appStore.bulkStore?.selection.length > 0
            ? (this.appStore.bulkStore.selection.length === 1
              ? this.appStore.i18n('bulk_selection_single')
              : this.appStore.i18n('bulk_selection_multiple')
                .replace('$1', `${this.appStore.bulkStore.selection.length}`))
            : this.appStore.i18n('bulk_selection_empty')
          }
        </span>
      </div>
    `;
  }
}
