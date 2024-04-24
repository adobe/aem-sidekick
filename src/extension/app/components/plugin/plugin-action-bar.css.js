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

/* istanbul ignore file */

import { css } from 'lit';

export const style = css`
  action-bar sp-action-group {
    padding: 12px;
    flex-wrap: nowrap;
  }

  action-bar sp-action-group:nth-of-type(2) {
    margin-left: auto;
  }

  action-bar sp-action-group div.plugin-container {
    overflow-x: hidden;
  }

  action-bar sp-action-group.not-authorized {
    padding: 0;
  }

  action-bar .plugin-container {
    width: auto;
  }

  action-bar sp-action-group:last-of-type > svg {
    width: 32px;
    height: 32px;
  }

  action-bar sp-action-group .filler {
    flex-grow: 1;
  }

  #plugin-menu {
    width: max-content;
  }

  action-bar action-bar-picker sp-menu-item {
    min-width: 120px;
  }

  #plugin-menu sp-menu-group [slot="header"] {
    text-transform: uppercase;
    font-size: var(--spectrum-global-dimension-font-size-75);
    color: var(--spectrum-global-color-gray-600);
  }

  #plugin-menu sp-menu-group sp-menu-item {
    padding-left: 24px;
  }

  @media (max-width: 800px) {
    #properties {
      display: none;
    }
  }
`;
