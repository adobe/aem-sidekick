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
import { reaction } from 'mobx';
import { appStore } from './store/app.js';

class AemSidekick extends LitElement {
  static properties = {
    theme: { type: String },
  };

  static styles = css`
    :host {
      position: fixed;
      z-index: 9999;
      left: 50%;
      transform: translate(-50%, 0px);
      bottom: 150px;
    }
  `;

  constructor() {
    super();
    this.theme = 'light';
  }

  async connectedCallback() {
    super.connectedCallback();
    this.getTheme();

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      this.getTheme();
    });

    this.reactionDisposer = reaction(
      // Reaction to this specific property
      () => appStore.userStore.value,
      () => {
        console.log('reaction: user store');
        // Update component when value changes
        this.requestUpdate();
      },
    );
  }

  disconnectedCallback() {
    this.reactionDisposer(); // Dispose reaction
    super.disconnectedCallback();
  }

  getTheme() {
    this.theme = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  render() {
    return html`
      <sp-theme
        theme="express"
        color=${this.theme === 'dark' ? 'dark' : 'light'}
        scale="medium"
      >
        <example-element></example-element>
        <action-bar></action-bar>
        ${appStore.userStore.value}
      </sp-theme>
    `;
  }
}

window.customElements.define('aem-sidekick', AemSidekick);
