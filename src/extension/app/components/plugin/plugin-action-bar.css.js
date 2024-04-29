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
  action-bar {
    position: absolute;
    right: 50%;
    transition: right 0.25s;
    transform: translate(50%, 0);
    bottom: 55px;
    min-width: var(--sidekick-min-width);
    max-width: var(--sidekick-max-width);
  }

  action-bar.collapsed {
    min-width: unset;
    left: unset;
    right: 15px;
    transform: translate(0px, 0px);
  }

  action-bar.collapsed sp-divider,
  action-bar.collapsed sp-action-group:first-of-type,
  action-bar.collapsed sp-action-group login-button,
  action-bar.collapsed sp-action-group sp-action-button.properties,
  action-bar.collapsed sp-action-group sp-action-button.plugin-list {
    display: none;
  }

  action-bar sp-action-group {
    padding: 12px;
  }

  action-bar sp-action-group:first-of-type {
    flex-grow: 1;
  }

  action-bar sp-action-group.not-authorized {
    padding: 0px;
  }

  action-bar .plugin-container {
    width: auto;
  }

  action-bar sp-action-group > button {
    background-color: transparent;
    border: none;
    padding: 0;
    width: 32px;
    height: 32px;
  }

  action-bar sp-action-group > button > svg {
    width: 32px;
    height: 32px;
  }
`;
