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

import { css } from 'lit';

export const style = css`
  :host {
    position: relative;

    --mod-menu-item-label-icon-color-disabled: var(--spectrum-gray-600);
    --mod-menu-item-description-color-disabled: var(--spectrum-gray-600);
    --mod-menu-item-label-content-color-disabled: var(--spectrum-gray-600);
  }
 
  action-bar-picker {
    width: auto;
  }

  action-bar-picker .heading {
    color: var(--spectrum-menu-item-description-color-default);
    font-size: 12px;
    line-height: 130%;
    padding-top: 8px;
    padding-bottom: 8px;
    padding-left: 9px;
  }

  action-bar-picker sp-menu-divider {
    margin-top: 6px;
    margin-bottom: 4px;
    margin-left: -12px;
    margin-right: -12px;
  }
  `;
