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
  }
 
  action-bar-picker {
    width: auto;
  }

  action-bar-picker .heading {
    color: var(--spectrum-menu-item-description-color-default);
    font-size: 12px;
    line-height: 130%;
    padding-bottom: 8px;
    padding-left: 9px;
  }

  action-bar-picker sp-menu-divider {
    margin-top: 6px;
    margin-bottom: 4px;
    margin-left: -12px;
    margin-right: -12px;
  }

  action-bar-picker.notification::after {
    content: '';
    position: absolute;
    top: -2px;
    right: -2px;
    width: 9px;
    height: 9px;
    background-color: #3B63FB;
    border-radius: 50%;
  }

  action-bar-picker.notification.env-edit::after {
    border: 1px solid var(--spectrum2-edit-background-default);
  }

  action-bar-picker.notification.env-preview::after {
    border: 1px solid var(--spectrum2-preview-background-default);
  }

  action-bar-picker.notification.env-live::after {
    border: 1px solid var(--spectrum2-live-background-default);
  }

  action-bar-picker .notification-item {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    padding-left: 8px;
    padding-right: 8px;
  }

  action-bar-picker .notification-item::after {
    content: '';
    position: absolute;
    top: 5px;
    right: 6px;
    width: 9px;
    height: 9px;
    background-color: #3B63FB;
    border-radius: 50%;
  }
`;
