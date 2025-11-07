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
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 999999999999;
    color: initial;
    font: initial;
    letter-spacing: initial;
    text-align: initial;
  }

  :host([open='true']) {
    display: block;
  }

  :host([open='false']) {
    display: none;
  }

  plugin-action-bar {
    position: absolute;
    left: 50%;
    transform: translate(-50%, 0px);
    bottom: 55px;
    pointer-events: auto;
    z-index: 1;
    width: auto;
    min-width: 640px;
    max-width: var(--sidekick-max-width);
    white-space:nowrap;
  }

  .aem-sk-special-view {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
  }

  .aem-sk-special-view iframe {
    border: 0;
    width: 100%;
    height: 100%;
    pointer-events: auto;
  }

  @media (max-width: 800px) {
    plugin-action-bar {
      min-width: unset;
      width: 100vw;
      max-width: 100vw;
      bottom: 0;
    }
  }
`;
