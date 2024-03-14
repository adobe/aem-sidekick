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
    --mod-popover-animation-distance: 13px;
    --mod-popover-background-color: var(--spectrum2-sidekick-background);
    --mod-popover-border-color: var(--spectrum2-sidekick-border-color);
    --mod-popover-corner-radius: var(--spectrum2-sidekick-border-radius);
    --mod-popover-filter: var(--spectrum2-sidekick-backdrop-filter);
    --mod-divider-thickness: 1px;
  }

  :host #button {
    border-radius: 8px;
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
  }

  :host(.env-preview) #button:hover {
    background-color: var(--spectrum2-preview-background-hover);
    border: 1px solid var(--spectrum2-preview-border-hover);
  }

  :host(.env-preview) #button[aria-expanded="true"] {
    background-color: var(--spectrum2-preview-background-hover);
    border: 1px solid var(--spectrum2-preview-border-open);
  }

  :host(.env-preview[disabled]) #button{
    background-color: transparent;
    border: 1px solid var(--spectrum2-preview-border-default);
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
  }

  :host(.env-live[disabled]) #button,
  :host(.env-prod[disabled]) #button {
    background-color: transparent;
    border: 1px solid var(--spectrum2-live-border-default);
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

  sp-menu-divider {
    background-color: #f30;
  }


  :host(.plugin-container) #button {
    background-color: transparent;
  }

  :host(.plugin-container) #button[aria-expanded="true"] {
    background-color: var(--spectrum-gray-400);
  }

  sp-menu {
    padding: 12px;
    gap: 4px;
  }

  sp-overlay sp-popover {
    backdrop-filter: var(--spectrum2-sidekick-backdrop-filter);
  }
`;
