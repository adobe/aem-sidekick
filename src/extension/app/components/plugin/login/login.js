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

import { customElement } from 'lit/decorators.js';
import { reaction } from 'mobx';
import { html, LitElement, css } from 'lit';
import { appStore } from '../../../store/app.js';

/**
 * Login Button component
 * @element login-button
 * @class LoginButton
 */
@customElement('login-button')
export class LoginButton extends LitElement {
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
  `;

  connectedCallback() {
    super.connectedCallback();

    reaction(
      () => appStore.status,
      () => {
        this.requestUpdate();
      },
    );
  }

  login() {
    appStore.login(true);
  }

  logout() {
    appStore.logout();
  }

  renderLogin() {
    const { profile } = appStore.status;
    return html`
      ${!appStore.status.profile || !appStore.isAuthenticated()
        ? html`
          <sp-action-button quiet class="login" @click=${this.login}>Sign in</sp-action-button>
        ` : ''
      }
      ${appStore.isAuthenticated()
        ? html`
          <sp-action-menu
            selects="single"
            placement="top"
            quiet
          >
            <sp-icon-real-time-customer-profile slot="icon"></sp-icon-real-time-customer-profile>
            <sp-menu-item class="user" value="user">
              ${profile.picture ? `<img src=${profile.picture} slot="icon" alt=${profile.name} />` : html`<div class="no-picture" slot="icon"><sp-icon-user size="xl"></sp-icon-user></div>`}
              ${profile.name}
              <span slot="description">${profile.email}</span>
            </sp-menu-item>
            <sp-menu-item class="logout" value="logourt" @click=${this.logout}>
              <sp-icon-log-out slot="icon" size="xl"></sp-icon-log-out>
              Logout
            </sp-menu-item>
          </sp-action-menu>
        ` : ''
      }
    `;
  }

  render() {
    return this.renderLogin();
  }
}
