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

import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { reaction } from 'mobx';
import { ICONS, SidekickState } from '../../../constants.js';
import { appStore } from '../../../store/app.js';

@customElement('activity-action')
export class ActivityAction extends LitElement {
  static styles = css`
    .container {
      display: flex;
      align-items: center;
      height: 100%;
      gap: 12px;
    }

    .container span {
      padding-bottom: 2px;
    }
  `;

  /**
   * Loads the user preferences for plugins in this environment.
   */
  async connectedCallback() {
    super.connectedCallback();

    reaction(
      () => appStore.state,
      () => {
        this.requestUpdate();
      },
    );
  }

  renderType() {
    switch (appStore.state) {
      case SidekickState.FETCHING_STATUS:
        return html`
          <sp-progress-circle size="s" indeterminate></sp-progress-circle><span>Loading status</span>
        `;
      case SidekickState.PREVIEWING:
        return html`
            <sp-progress-circle size="s" indeterminate></sp-progress-circle><span>Updating <b>Preview</b></span>
          `;
      case SidekickState.PUBLISHNG:
        return html`
            <sp-progress-circle size="s" indeterminate></sp-progress-circle><span>Updating <b>Publish</b></span>
          `;
      case SidekickState.LOGIN_REQUIRED:
        return html`
          ${ICONS.INFO}<span>Sign in to continue</span>
        `;
      case SidekickState.UNAUTHORIZED:
        return html`
          ${ICONS.INFO}<span>Account not authorized</span>
        `;
      default:
        return html``;
    }
  }

  render() {
    return html`
      <div class="container">
        ${this.renderType()}
      </div>
    `;
  }
}
