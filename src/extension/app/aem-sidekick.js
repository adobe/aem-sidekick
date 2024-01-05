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

/* eslint-disable wc/no-constructor-params */

import { html } from 'lit';
import { MobxLitElement } from '@adobe/lit-mobx';
import { customElement } from 'lit/decorators.js';
import { style } from './aem-sidekick.css.js';
import { appStore } from './store/app.js';

@customElement('aem-sidekick')
export class AEMSidekick extends MobxLitElement {
  static get styles() {
    return [style];
  }

  constructor(config) {
    super();
    appStore.loadContext(this, config);

    this.addEventListener('contextloaded', (data) => {
      // eslint-disable-next-line no-console
      console.log('console was loaded', data);
    });
  }

  render() {
    return html`
      <theme-wrapper>
        <plugin-action-bar></plugin-action-bar>
        <toast-container></toast-container>
        <modal-container></modal-container>
      </theme-wrapper>
    `;
  }
}
