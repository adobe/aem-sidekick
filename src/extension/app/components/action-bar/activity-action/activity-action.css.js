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

import { css } from 'lit';

export const style = css`
  :host {
    width: 100%;
  }

  .container {
    margin-left: 4px;
    display: flex;
    align-items: center;
    height: 100%;
    gap: 12px;
    color: var(--spectrum2-sidekick-color);
  }

  .container span {
    padding-bottom: 2px;
  }

  .container i.code {
    user-select: none;
    margin-right: -5px;
    font-family: monospace;
    font-weight: bold;
    font-style: normal;
    transform: scaleX(.75);
  }

  .toast-container {
    color: #fff;
    display: flex;
    align-items: center;
    flex-direction: row;
    width: 100%;
  }

  .toast-container .message {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-grow: 1;
  }

  .toast-container .message > span {
    white-space:pre-wrap;
  }

  .toast-container .message > svg {
    flex-shrink:0;
  }

  .toast-container .actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .toast-container .actions sk-action-button {
    color: #fff;
    border-radius: 16px;
    --highcontrast-actionbutton-background-color-hover: #fff4;
    --highcontrast-actionbutton-background-color-active: #fff2;
  }

  .toast-container .actions sk-action-button.close {
    color: #fff;
  }

  .toast-container .actions sk-action-button.action {
    --highcontrast-actionbutton-background-color-default: #fff2;
    height: 100%;
    min-height: 32px;
    min-width: 65px;
    padding-bottom: 2px;
  }
`;
