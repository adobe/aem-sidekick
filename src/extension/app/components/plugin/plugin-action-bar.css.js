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
  action-bar > div.action-group {
    display: flex;
    padding: 12px;
    gap: 8px;
    flex-wrap: nowrap;
    align-items: center;
  }

  action-bar > div.activity-container,
  action-bar > div.plugins-container {
    width: 100%;
  }

  action-bar > div.action-group:not(.plugins-container):not(.activity-container):nth-of-type(1) {
    margin-left: auto;
    padding: 12px 0;
  }

  action-bar > div.plugin-menu-container {
    width: 42px;
  }

  action-bar sp-action-group.not-authorized {
    padding: 0;
  }

  action-bar .logo {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  action-bar .logo > svg{
    width: 24px;
    height: 24px;
  }

  #plugin-menu {
    width: max-content;
  }

  action-bar action-bar-picker sk-menu-item {
    min-width: 120px;
  }

  /**
   * Work around the fact that we can't tab into sp-action-group
   */

  action-bar sp-action-menu sk-menu-item {
    margin: 0 8px;
  }

  action-bar sp-action-menu sk-menu-item:first-of-type {
    margin: 8px 8px 0;
  }

  action-bar sp-action-menu sk-menu-item:last-of-type {
    margin: 0 8px 8px;
  }

  action-bar sp-action-menu sk-menu-item:only-of-type {
    margin: 8px;
  }

  action-bar sp-action-menu sk-menu-item.close {
    margin: 4px 8px 8px;
  }

  action-bar sp-action-menu sp-menu-divider {
    margin: 0;
  }

  action-bar > sp-menu-divider {
    height: 56px;
  }

  action-bar div.plugins-container > sp-menu-divider:last-child {
    display: none;
  }

  action-bar sp-action-menu sp-menu-group {
    --mod-menu-group-gap: 0;
  }

  #plugin-menu sp-menu-group [slot="header"] {
    text-transform: uppercase;
    font-size: var(--spectrum-global-dimension-font-size-75);
    color: var(--spectrum-global-color-gray-600);
  }

  @media (max-width: 500px) {
    #properties {
      display: none;
    }
  }
`;
