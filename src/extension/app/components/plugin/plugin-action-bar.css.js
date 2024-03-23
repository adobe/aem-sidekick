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
  action-bar sp-action-group {
    padding: 12px;
  }

  action-bar sp-action-group.not-authorized {
    padding: 0px;
  }

  action-bar .plugin-container {
    width: auto;
  }

  action-bar sp-action-group > svg {
    width: 32px;
    height: 32px;
  }

  sp-divider {
    background-color: var(--spectrum2-sidekick-border-color);
  }

  action-bar #plugin-list-overlay sp-popover {
    position: absolute;
    top: calc((100vh / 2));
    left: calc(100vw / 2);
    transform: translate(-50%, -50%);
    margin-bottom: 14px;
  }

  action-bar #plugin-list-menu {
    background-color: var(--spectrum-global-color-gray-100);
    backdrop-filter: var(--spectrum2-sidekick-backdrop-filter);
    border-radius: var(--spectrum2-large-border-radius);
    border:  1px solid var(--spectrum-global-color-gray-300);
    box-shadow: var(--spectrum2-sidekick-box-shadow);
    width: 400px;
    min-height: 400px;
    padding: 0;
  }

  action-bar .filter-container {
    padding: 0 16px;
    box-model: border-box;
    height: 46px;
    overflow: hidden;
  }

  action-bar sp-textfield {
    width: 100%;
    opacity: 0.7;
  }

  action-bar sp-menu > sp-menu-group {
    padding: 0 8px;
    min-height: 310px;
  }

  action-bar sp-menu-group span[slot="header"] {
    display: block;
    margin-top: 8px;
    font-size: smaller;
    text-transform: uppercase;
  }

  action-bar .menu-item-container {
    margin-bottom: 4px;
    position: relative;
  }

  action-bar .menu-item-container::last-child {
    margin-bottom: 0;
  }

  action-bar .menu-item-container > sp-button {
    position: absolute;
    color: currentColor;
    top: 0;
    right: 0;
    border-color: transparent;
  }

  action-bar .keyboard-hints {
    display: flex;
    flex-direction: row;
    padding: 8px;
    font-size: smaller;
    color: var(--spectrum-global-color-gray-600);
  }

  action-bar .keyboard-hints > div {
    display: flex;
    align-items: center;
    margin-right: 8px;
  }

  action-bar .keyboard-hints > div.last {
    flex-grow: 1;
    justify-content: flex-end;
    margin-right: 0;
  }

  action-bar .keyboard-hints span {
    margin: 0 4px;
  }

  action-bar .keyboard-hints sp-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 2px;
    background-color: var(--spectrum-global-color-gray-300);
    border-radius: 4px;
    padding: 3px;
  }

  action-bar .keyboard-hints sp-icon > svg {
    width: 10px;
    height: 10px;
  }
`;
