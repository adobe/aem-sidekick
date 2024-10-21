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

import { customElement, property, state } from 'lit/decorators.js';
import { reaction } from 'mobx';
import { html, css } from 'lit';
import { ifDefined } from '@spectrum-web-components/base/src/directives.js';
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

  /**
   * Are we ready to enable?
   * @type {String}
   */
  @state()
  accessor profilePicture;

  static styles = css`
    sp-action-menu {
      --mod-actionbutton-edge-to-text: 8px;
    }
    
    sp-action-menu sk-menu-item {
      padding-inline-start: 0;
      min-width: 202px;
      margin: 8px;
    }

    sp-action-menu sk-menu-item .no-picture {
      display: flex;
      width: 32px;
      height: 32px;
      align-items: center;
      justify-content: center;
    }

    sp-action-menu sk-menu-item .no-picture svg {
      width: 20px;
      height: 20px;
    }

    sp-action-menu sk-menu-item.user {
      pointer-events: none;
      --mod-menu-item-bottom-edge-to-text: 0;
      --mod-menu-item-top-edge-to-text: 0;
    }

    sp-action-menu sk-menu-item.user[focused] {
      box-shadow: unset;
      background-color: unset;
    }

    sp-action-menu > sp-icon {
      width: 20px;
      height: 24px;
    }

    sp-action-menu > sp-icon.picture {
      width: 24px;
      height: 24px;
    }

    sp-action-menu > sp-icon > img {
      width: 24px;
      height: 24px;
      border-radius: 50%;
    }
    
    sk-progress-circle[size="s"] {
      margin: 0 8px;
    }

    sp-icon.loading {
      opacity: 0.4;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--spectrum2-sidekick-color);
    }

    sp-icon.loading > svg,
    sp-action-menu > sp-icon > svg {
      width: 20px;
      height: 20px;
    }

    sp-action-menu > sp-icon > svg {
      margin-top: 2px;
    }

    :host {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    :host(.no-login) {
      display: none;
    }

    :host(.not-authorized) sk-action-button.login {
      background-color: var(--spectrum-blue-700);
      color: #fff;
    }

    @media (prefers-color-scheme: light) {
      :host(.not-authorized) sk-action-button.login {
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
      async () => {
        const { profile } = this.appStore.status;
        if (profile) {
          const { picture } = profile;
          if (picture && picture.startsWith('https://admin.hlx.page/')) {
            const resp = await fetch(picture, { credentials: 'include' });
            this.profilePicture = resp.ok ? URL.createObjectURL(await resp.blob()) : null;
          } else {
            this.profilePicture = picture;
          }
        }

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

    if ((!this.appStore.status.webPath && this.appStore.status?.status !== 401)
      || this.appStore.state === STATE.LOGGING_IN
      || this.appStore.state === STATE.LOGGING_OUT) {
      return html`
        <sp-icon slot="icon" class="loading" size="l">
          ${ICONS.USER_ICON}
        </sp-icon>
      `;
    }

    if (!authenticated) {
      return html`<sk-action-button quiet class="login" @click=${this.login}>${this.appStore.i18n('user_login')}</sk-action-button>`;
    } else {
      return html`
        <sp-action-menu
          placement="top"
          quiet
        >
          <sp-icon slot="icon" size="l" class=${ifDefined(profile.picture && this.profilePicture ? 'picture' : undefined)}>
            ${profile.picture && this.profilePicture ? html`<img src=${this.profilePicture} alt=${profile.name} />` : html`${ICONS.USER_ICON}`}
          </sp-icon>
          <sk-menu-item class="user" value="user" tabindex="-1" disabled>
            ${profile.picture && this.profilePicture ? html`<img src=${this.profilePicture} slot="icon" alt=${profile.name} />` : html`<div class="no-picture" slot="icon">${ICONS.USER_ICON}</div>`}
            ${profile.name}
            <span slot="description">${profile.email}</span>
          </sk-menu-item>
          <sp-divider size="s"></sp-divider>
          <sk-menu-item class="logout" value="logout" @click=${this.logout} tabindex="0">
            <sp-icon slot="icon" size="xl">
              ${ICONS.SIGN_OUT}
            </sp-icon>
            ${this.appStore.i18n('user_logout')}
          </sk-menu-item>
        </sp-action-menu>
      `;
    }
  }

  render() {
    return this.renderLogin();
  }
}
