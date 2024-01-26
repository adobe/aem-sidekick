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

/* istanbul ignore file */

import { css } from 'lit';

export const style = css`
  :host(:not(.env-edit)[class]),
  :host(:not(.env-edit)[class]) #label {
    color: var(--spectrum-white);
  }

  :host(.current-env) #label {
    font-weight: 700;
  }

  :host(.current-env.env-preview){
    background-color: #1379F3;
    border-radius: 4px;
  }

  :host(.current-env.env-preview) #label {
    color: var(--spectrum-white);
    font-weight: 700;
  }

  :host(.current-env) [name="description"]::slotted(*){
    color: var(--spectrum-gray-800);
    font-weight: 400;
  }

  :host(.current-env.env-live),
  :host(.current-env.env-prod) {
    background-color: #009112;
    border-radius: 4px;
    font-weight: 700;
  }

  sp-status-light {
    position: absolute;
    top: 0;
    right: 0;
  }

  @media (prefers-color-scheme: light) {
    :host(.current-env) #label,
    :host(.current-env) [name="description"]::slotted(*){
      color: var(--spectrum-white);
    }

    :host(:not(.env-edit, .current-env)[class]),
    :host(:not(.env-edit, .current-env)[class]) #label,
    :host(:not(.env-edit, .current-env)[class]) [name="description"]::slotted(*) {
      color: var(--spectrum-gray-800);
    }
  }
`;
