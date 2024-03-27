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
  sp-divider {
    background-color: var(--spectrum2-sidekick-border-color);
  }

  .plugin-list-container {
    width: 400px;
    min-height: 400px;
    padding: 0;
  }

  .filter-container {
    padding: 0 16px;
    box-model: border-box;
    height: 46px;
    overflow: hidden;
  }

  sp-textfield {
    width: 100%;
    opacity: 0.7;
  }

  sp-menu {
    width: 100%
  }

  sp-menu-group {
    padding: 0 8px;
    min-height: 310px;
  }

  sp-menu-group span[slot="header"] {
    display: block;
    margin-top: 8px;
    font-size: smaller;
    text-transform: uppercase;
  }

  .menu-item-container {
    margin-bottom: 4px;
    position: relative;
  }

  .menu-item-container sp-menu-item span.parent:not(:empty)::after {
    content: ">";
    padding: 0 8px;
  }

  .menu-item-container::last-child {
    margin-bottom: 0;
  }

  .menu-item-container > sp-button {
    position: absolute;
    color: currentColor;
    top: 0;
    right: 0;
    border-color: transparent;
  }

  .keyboard-hints-container {
    display: flex;
    flex-direction: row;
    padding: 8px;
    font-size: smaller;
    color: var(--spectrum-global-color-gray-600);
  }

  .keyboard-hints-container > div {
    display: flex;
    align-items: center;
    margin-right: 8px;
  }

  .keyboard-hints-container > div.last {
    flex-grow: 1;
    justify-content: flex-end;
    margin-right: 0;
  }

  .keyboard-hints-container span {
    margin: 0 4px;
  }

  .keyboard-hints-container sp-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 2px;
    background-color: var(--spectrum-global-color-gray-300);
    border-radius: 4px;
    padding: 3px;
  }

  .keyboard-hints-container sp-icon > svg {
    width: 10px;
    height: 10px;
  }
`;
