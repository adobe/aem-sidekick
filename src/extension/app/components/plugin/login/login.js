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
import { SIDEKICK_STATE } from '../../../constants.js';

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
    const showLogin = !profile && !this.appStore.siteStore.authorized;
    const authenticated = this.appStore.isAuthenticated();

    if (!showLogin && !authenticated) {
      // eslint-disable-next-line wc/no-self-class
      this.classList.add('no-login');
    }

    if (this.appStore.state === SIDEKICK_STATE.LOGIN_REQUIRED) {
      return html`<sp-action-button quiet class="login" @click=${this.login}>${this.appStore.i18n('user_login')}</sp-action-button>`;
    } else if (authenticated) {
      return html`
        <sp-action-menu
          selects="single"
          placement="top"
          quiet
        >
          <sp-icon slot="icon" size="l">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 1.125C4.65776 1.125 1.125 4.65776 1.125 9C1.125 13.3422 4.65776 16.875 9 16.875C13.3422 16.875 16.875 13.3422 16.875 9C16.875 4.65776 13.3422 1.125 9 1.125ZM9 2.475C12.5978 2.475 15.525 5.4022 15.525 9C15.525 10.4686 15.0314 11.8208 14.2094 12.9125C12.8759 11.7931 10.9813 11.1375 9 11.1375C6.9594 11.1375 5.02421 11.8043 3.78232 12.9014C2.96538 11.8116 2.475 10.4637 2.475 9C2.475 5.4022 5.4022 2.475 9 2.475ZM4.69831 13.8934C5.68982 13.0303 7.31586 12.4875 9 12.4875C10.6176 12.4875 12.2058 13.0199 13.2916 13.9026C12.143 14.9094 10.6437 15.525 9 15.525C7.35144 15.525 5.84819 14.9055 4.69831 13.8934ZM9.0523 10.2599C9.03297 10.2599 9.00088 10.2507 8.99561 10.2595C8.42212 10.2595 7.86358 10.0969 7.3793 9.78881C6.90293 9.48383 6.51401 9.05932 6.25342 8.55923C5.97832 8.03452 5.83726 7.44258 5.84648 6.84887C5.82451 5.70366 6.39536 4.62436 7.37402 3.98452C8.36235 3.35654 9.63105 3.3561 10.6132 3.97968C11.0883 4.2873 11.4768 4.70918 11.7422 5.20224C12.0182 5.71113 12.1605 6.28769 12.1535 6.86777C12.1632 7.4439 12.0226 8.03848 11.7466 8.56714C11.4851 9.06767 11.0962 9.49438 10.622 9.80112C10.1483 10.1026 9.60821 10.2599 9.0523 10.2599ZM9.00879 8.90947H9.01759C9.33091 8.92353 9.63106 8.83168 9.89298 8.6647C10.1676 8.48715 10.3962 8.23623 10.5495 7.94224C10.7218 7.61265 10.8097 7.24175 10.8035 6.87041C10.8079 6.50083 10.7218 6.15235 10.5544 5.84385C10.3957 5.54854 10.1641 5.29717 9.88463 5.11612C9.34806 4.77598 8.64801 4.7751 8.10528 5.11964C7.52565 5.49845 7.18331 6.14577 7.19649 6.8467C7.19077 7.23869 7.27823 7.60651 7.44962 7.9339C7.60254 8.22614 7.82887 8.474 8.10528 8.65066C8.37115 8.81985 8.67921 8.9095 8.99562 8.9095L9.00879 8.90947Z" fill="currentColor"/>
            </svg>
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

    return html``;
  }

  render() {
    return this.renderLogin();
  }
}
