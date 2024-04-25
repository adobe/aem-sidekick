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
    display: flex;
    align-items: center;
    height: 100%;
    gap: 12px;
  }

  .container span {
    padding-bottom: 2px;
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

  .toast-container .actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .toast-container .actions sp-action-button {
    color: #fff;
    border-radius: 16px;
    --highcontrast-actionbutton-background-color-hover: #fff4;
    --highcontrast-actionbutton-background-color-active: #fff2;
  }

  .toast-container .actions sp-action-button.close {
    color: #fff;
  }
  
  .toast-container .actions sp-action-button.action {
    --highcontrast-actionbutton-background-color-default: #fff2;
    height: 100%;
    min-height: 32px;
    min-width: 65px;
    padding-bottom: 2px;
  }
`;
