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

import { customElement, property } from 'lit/decorators.js';
import { reaction } from 'mobx';
import { html, css } from 'lit';
import { ConnectedElement } from '../../connected-element/connected-element.js';
import { ICONS, STATE } from '../../../constants.js';

/**
 * Login Button component
 * @element login-button
 * @class LoginButton
 */
@customElement('login-button')
export class LoginButton extends ConnectedElement {
  /**
   * Are we ready to enable?
   * @type {Boolean}
   */
  @property({ type: Boolean })
  accessor ready = false;

  static styles = css`
    sp-action-menu {
      --mod-popover-content-area-spacing-vertical: 0;
      --mod-popover-animation-distance: 15px;
    }

    sp-action-menu sp-menu-item {
      min-height: 56px;
      padding-inline-start: 12px;
      min-width: 240px;
    }

    sp-action-menu sp-menu-item .no-picture {
      display: flex;
      width: 32px;
      height: 32px;
      align-items: center;
      justify-content: center;
    }

    sp-progress-circle[size="s"] {
      margin: 0 8px;
    }

    :host {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    :host(.no-login) {
      display: none;
    }

    :host(.not-authorized) sp-action-button.login {
      background-color: var(--spectrum-blue-600);
      color: #fff;
    }

    @media (prefers-color-scheme: light) {
      :host(.not-authorized) sp-action-button.login {
        background-color: var(--spectrum-blue-900);
      }
    }
  `;

  connectedCallback() {
    super.connectedCallback();

    reaction(
      () => this.appStore.status,
      () => {
        this.requestUpdate();
      },
    );

    reaction(
      () => this.appStore.state,
      () => {
        this.requestUpdate();
      },
    );

    // As soon as there is any change to the profile we want to be notified
    reaction(
      () => this.appStore.status.profile,
      () => {
        this.requestUpdate();
      },
    );
  }

  login() {
    this.appStore.login(true);
  }

  logout() {
    this.appStore.logout();
  }

  renderLogin() {
    const { profile } = this.appStore.status;
    const authenticated = this.appStore.isAuthenticated();

    if (!this.appStore.status.webPath && this.appStore.status?.status !== 401) {
      return html``;
    }
    if (this.appStore.state === STATE.LOGGING_IN
      || this.appStore.state === STATE.LOGGING_OUT) {
      return html`<sp-progress-circle size="s" indeterminate></sp-progress-circle>`;
    }

    if (!authenticated) {
      return html`<sp-action-button quiet class="login" @click=${this.login}>${this.appStore.i18n('user_login')}</sp-action-button>`;
    } else {
      return html`
        <sp-action-menu
          selects="single"
          placement="top"
          quiet
        >
          <sp-icon slot="icon" size="l">
            ${ICONS.USER_ICON}
          </sp-icon>
          <sp-menu-item class="user" value="user">
            ${profile.picture ? html`<img src=${profile.picture} slot="icon" alt=${profile.name} />` : html`<div class="no-picture" slot="icon"><sp-icon-user size="xl"></sp-icon-user></div>`}
            ${profile.name}
            <span slot="description">${profile.email}</span>
          </sp-menu-item>
          <sp-menu-item class="logout" value="logourt" @click=${this.logout}>
            <sp-icon-log-out slot="icon" size="xl"></sp-icon-log-out>
            Logout
          </sp-menu-item>
        </sp-action-menu>
      `;
    }
  }

  render() {
    return this.renderLogin();
  }
}
