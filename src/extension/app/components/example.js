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

import { LitElement, html } from 'lit';
import { reaction } from 'mobx';
import { appStore } from '../store/app.js';

export class ExampleElement extends LitElement {
  connectedCallback() {
    super.connectedCallback();

    console.log('autorun example-element');

    this.reactionDisposer = reaction(
      // Reaction to this specific property
      () => appStore.siteStore.value,
      () => {
        console.log('reaction: site store');
        // Update component when value changes
        this.requestUpdate();
      },
    );
  }

  disconnectedCallback() {
    this.autoRunDisposer(); // Dispose autorun
    super.disconnectedCallback();
  }

  render() {
    return html`
      <div>Site Store Value: ${appStore.siteStore.value} ${appStore.userStore.value}</div>
    `;
  }
}

window.customElements.define('example-element', ExampleElement);
