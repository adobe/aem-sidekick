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
  :host(.current-env) {
    margin-bottom: 7px;
  }

  :host(.current-env) #label {
    font-weight: 700;
  }

  :host(.current-env.env-edit[aria-disabled="true"]) [name="description"]::slotted(*) {
    font-weight: 400;
    font-size: var(--spectrum-font-size-50);
  }

  :host(.current-env.env-edit[aria-disabled="true"]) {
    background-color: var(--spectrum-gray-200);
    border: 1px solid var(--spectrum2-edit-border-default);
    border-radius: var(--spectrum2-default-border-radius);
  }

  :host(:hover) {
    border-radius: var(--spectrum2-default-border-radius);
  }

  :host([focused]) {
    box-shadow: unset;
    outline: 2px solid var(--spectrum2-color-focus);
    border-radius: var(--spectrum2-medium-border-radius);
  }

  :host(.current-env.env-edit[aria-disabled="true"]) #label,
  :host(.current-env.env-edit[disabled]) #label,
  :host(.current-env.env-edit[aria-disabled="true"]) [name="description"]::slotted(*),
  :host(.current-env.env-edit[disabled]) [name="description"]::slotted(*) {
    color: var(--spectrum2-sidekick-color);
  }

  :host(.current-env.env-preview){
    background-color: var(--spectrum2-preview-background-default);
    border: 1px solid var(--spectrum2-preview-border-default);
    border-radius: var(--spectrum2-default-border-radius);
    --mod-menu-item-background-color-hover: var(--spectrum2-preview-background-hover);
  }

  :host(.current-env.env-dev) #label,
  :host(.current-env.env-preview) #label,
  :host(.current-env.env-live) #label,
  :host(.current-env.env-prod) #label {
    color: var(--spectrum-white);
    font-weight: 700;
  }

  :host(.current-env) [name="description"]::slotted(*){
    color: var(--spectrum2-preview-content-default);
    font-weight: 400;
  }

  :host(.current-env.env-live),
  :host(.current-env.env-prod) {
    background-color: var(--spectrum2-live-background-default);
    border: 1px solid var(--spectrum2-live-border-default);
    border-radius: var(--spectrum2-default-border-radius);
    font-weight: 700;
  }

  :host(.current-env.env-live[aria-disabled="true"]) [name="description"]::slotted(*),
  :host(.current-env.env-prod[aria-disabled="true"]) [name="description"]::slotted(*),
  :host(.current-env.env-live[disabled]) [name="description"]::slotted(*),
  :host(.current-env.env-prod[disabled]) [name="description"]::slotted(*) {
    color: var(--spectrum2-live-content-default);
  }

  :host(.env-edit) {
    display: flex;
    height: 50px;
    flex-direction: column;
    align-items: flex-start;
  }

  ::slotted([slot=icon]) {
    margin-left: auto;
    margin-inline-end: 0;
  }

  :host(.env-edit) ::slotted([slot=icon]) {
    position: absolute;
    right: 7px;
    top: 11px;
    color: var(--spectrum-menu-item-label-icon-color-default);
  }

  sp-status-light {
    position: absolute;
    top: 0;
    right: 0;
  }

  .user-item {
    display: flex;
    align-items: center;
    gap: 6px;
    height: 46px;
    padding-right: 12px;
    --mod-menu-item-label-icon-color-disabled: var(--spectrum-gray-800);
    --mod-menu-item-description-color-disabled: var(--spectrum-gray-800);
    --mod-menu-item-label-content-color-disabled: var(--spectrum-gray-800);
  }

  .user-item > slot {
    display: flex;
  }

  .user-item .info {
    display: flex;
    flex-direction: column;
    padding-top: 5.5px;
    padding-bottom: 7.5px;
  }

  .user-item .info #label {
    height: 18px;
    font-weight: 600;
  }

  .user-item #image {
    width: 32px;
    height: 32px;
    display: flex;
    justify-content: center;
  }

  .user-item slot::slotted(img) {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    margin-left: unset;
    margin-top: 3px;
  }

  .icon-item {
    display: flex;
    align-items: center;
    height: 18px;
    gap: 7px;
    padding-top: 1px;
  }

  :host(.icon-item.destructive) {
    color: var(--spectrum2-foreground-color-negative);
    --highcontrast-menu-item-color-default: var(--spectrum2-foreground-color-negative);
  }

  .logout-item {
    display: flex;
    align-items: center;
    height: 23px;
    gap: 10px;
  }

  .logout-item #label,
  .logout-item slot::slotted(sp-icon) {
    color: var(--spectrum2-foreground-color-negative);
  }

  .logout-item > slot::slotted(sp-icon) {
    margin-left: 12px;
    margin-top: 3px;
    width: 18px;
    height: 18px;
  }

  @media (prefers-color-scheme: light) {
    :host(.current-env.env-dev) #label,
    :host(.current-env.env-preview) #label,
    :host(.current-env.env-live) #label,
    :host(.current-env.env-prod) #label {
      color: var(--spectrum-gray-800);
    }

    :host(:not(.env-edit, .current-env, .logout)[class], [disabled]),
    :host(:not(.env-edit, .current-env, .logout)[class]) #label,
    :host(:not(.env-edit, .current-env, .logout)[class]) [name="description"]::slotted(*) {
      color: var(--spectrum-gray-800);
    }
  }
`;
