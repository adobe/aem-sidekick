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
    position: fixed;
    height: 100%;
    width: 100%;
    pointer-events: none;
    z-index: 999999999999;
  }

  :host([open='true']) {
    display: block;
  }

  :host([open='false']) {
    display: none;
  }

  action-bar {
    position: absolute;
    left: 50%;
    transform: translate(-50%, 0px);
    bottom: 55px;
    pointer-events: auto;
  }

  action-bar sp-action-group {
    padding: 12px;
  }

  action-bar sp-action-group span {
    padding-bottom: 2px;
    padding-left: 8px;
    margin: 0;
    display: flex;
    align-items: center;
    color: var(--spectrum2-sidekick-color);
  }
`;
