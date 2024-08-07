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
    --mod-divider-thickness: 1px;
  }

  :host #button,
  :host([quiet]) #button {
    border-radius: var(--spectrum2-default-border-radius);
  }

  :host #button:focus-visible:after,
  :host([quiet]) #button:focus-visible:after {
    border-radius: var(--spectrum2-large-border-radius);
  }

  :host([quiet]) #button:focus-visible {
    background-color: var(--mod-actionbutton-background-color-focus);
  }

  :host([quiet]) #button:focus-visible:after {
    box-shadow: rgb(20, 122, 243) 0px 0px 0px 2px;
    margin: -3px;
  }

  :host(.env-edit) #button #label,
  :host(.env-edit) #button sp-icon-chevron100,
  :host(.env-edit) #button:hover sp-icon-chevron100,
  :host(.env-edit[open]) #button:hover sp-icon-chevron100 {
    color: var(--spectrum2-edit-content-default);
    --spectrum-picker-icon-color-default-open: var(--spectrum2-edit-content-default);
  }

  :host(.env-edit) #button{
    background-color: var(--spectrum2-edit-background-default);
    border: 1px solid var(--spectrum2-edit-border-default);
  }

  :host(.env-edit) #button:hover {
    background-color: var(--spectrum2-edit-background-hover);
    border: 1px solid var(--spectrum2-edit-border-hover);
  }

  :host(.env-edit) #button[aria-expanded="true"] {
    background-color: var(--spectrum2-edit-background-hover);
    border: 1px solid var(--spectrum2-edit-border-open);
  }

  :host(.env-edit[disabled]) #button #label,
  :host(.env-edit[disabled]) #button sp-icon-chevron100,
  :host(.env-edit[disabled]) #button:hover sp-icon-chevron100 {
    color: var(--spectrum2-edit-border-default);
    --spectrum-picker-icon-color-default-open: var(--spectrum2-edit-border-default);
  }


  :host(.env-preview) #button #label,
  :host(.env-preview) #button sp-icon-chevron100,
  :host(.env-preview) #button:hover sp-icon-chevron100,
  :host(.env-preview[open]) #button:hover sp-icon-chevron100 {
    color: var(--spectrum2-preview-content-default);
    --spectrum-picker-icon-color-default-open: var(--spectrum2-preview-content-default);
  }

  :host(.env-preview) #button {
    background-color: var(--spectrum2-preview-background-default);
    border: 1px solid var(--spectrum2-preview-border-default);
    --mod-picker-background-color-hover-open: var(--spectrum2-preview-background-hover);
    --mod-picker-border-color-hover-open: var(--spectrum2-preview-border-hover);
  }

  :host(.env-preview) #button:hover {
    background-color: var(--spectrum2-preview-background-hover);
    border: 1px solid var(--spectrum2-preview-border-hover);
  }

  :host(.env-preview) #button[aria-expanded="true"] {
    background-color: var(--spectrum2-preview-background-hover);
    border: 1px solid var(--spectrum2-preview-border-open);
  }

  :host(.env-preview[disabled]) #button {
    opacity: 0.48;
  }

  :host(.env-preview[disabled]) #button #label,
  :host(.env-preview[disabled]) #button sp-icon-chevron100,
  :host(.env-preview[disabled]) #button:hover sp-icon-chevron100 {
    color: var(--spectrum2-preview-border-default);
    --spectrum-picker-icon-color-default-open: var(--spectrum2-preview-border-default);
  }

  :host(.env-live) #button #label,
  :host(.env-prod) #button #label,
  :host(.env-live) #button sp-icon-chevron100,
  :host(.env-prod) #button sp-icon-chevron100,
  :host(.env-live) #button:hover sp-icon-chevron100,
  :host(.env-prod) #button:hover sp-icon-chevron100,
  :host(.env-live[open]) #button:hover sp-icon-chevron100,
  :host(.env-prod[open]) #button:hover sp-icon-chevron100  {
    color: var(--spectrum2-live-content-default);
    --spectrum-picker-icon-color-default-open: var(--spectrum2-live-content-default);
  }

  :host(.env-live) #button,
  :host(.env-prod) #button {
    background-color: var(--spectrum2-live-background-default);
    border: 1px solid var(--spectrum2-live-border-default);
    --mod-picker-background-color-hover-open: var(--spectrum2-live-background-hover);
    --mod-picker-border-color-hover-open: var(--spectrum2-live-border-hover);
  }

  :host(.env-live[disabled]) #button,
  :host(.env-prod[disabled]) #button {
    opacity: 0.48;
  }

  :host(.env-live[disabled]) #button #label,
  :host(.env-prod[disabled]) #button #label,
  :host(.env-live[disabled]) #button sp-icon-chevron100,
  :host(.env-prod[disabled]) #button sp-icon-chevron100,
  :host(.env-live[disabled]) #button:hover sp-icon-chevron100,
  :host(.env-prod[disabled]) #button:hover sp-icon-chevron100 {
    color: var(--spectrum2-live-border-default);
    --spectrum-picker-icon-color-default-open: var(--spectrum2-live-border-default);
  }

  :host(.env-live) #button:hover,
  :host(.env-prod) #button:hover {
    background-color: var(--spectrum2-live-background-hover);
    border: 1px solid var(--spectrum2-live-border-hover);
  }

  :host(.env-live) #button[aria-expanded="true"],
  :host(.env-prod) #button[aria-expanded="true"] {
    background-color: var(--spectrum2-live-background-hover);
    border: 1px solid var(--spectrum2-live-border-open);
  }

  :host(.plugin-container) #button {
    background-color: transparent;
    gap: 10px;
  }

  :host(.plugin-container) #button[aria-expanded="true"] {
    background-color: var(--spectrum-gray-400);
  }

  :host([chevron="false"]) #button sp-icon-chevron100 {
    display: none;
  }

  :host([quiet]) #button {
    margin-top: 0;
  }

  :host([quiet]) #button:hover {
    background-color: var(--mod-actionbutton-background-color-focus);
  }

  :host([quiet]) #button #label {
    margin-top: 0;
    margin-block-end: 0;
    padding: 0 12px;
    font-size: var(--spectrum-global-dimension-font-size-100);
  }

  :host([quiet]) #button .picker {
    margin-inline-start: 0;
    margin-inline-end: 8px;
  }

  sp-menu {
    padding: 8px;
    gap: 4px;
    overflow-x: hidden;
  }

  sp-popover {
    backdrop-filter: var(--sidekick-backdrop-filter);
    padding: 0;
  }

  sp-overlay:not(:defined) {
    display: unset;
  }

  :host(.env-switcher) sp-popover {
    min-width: 256px !important;
  }

  :host(#plugin-menu) sp-popover {
    min-width: 100px;
  }
`;
