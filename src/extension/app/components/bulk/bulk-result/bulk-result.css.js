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
  .container {
    min-width: 100%;
    max-width: 640px;
    max-height: 284px;
    overflow-y: scroll;
    user-select: text;
    background-color: var(--spectrum2-sidekick-background);
  }

  .container .row {
    white-space: nowrap;
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    align-items: center;
    gap: 8px;
    border-bottom: 1px solid var(--spectrum2-sidekick-border-color);
  }

  .container .row.header {
    min-height: 36px;
    padding: 0px 16px;
    font-weight: bold;
    position: sticky;
    top: 0;
    color: var(--spectrum2-foreground-color-strong);
    background-color: var(--spectrum2-sidekick-background);
  }

  .container .row:not(.header) {
    padding: 13px 16px;
    border-bottom: 1px solid var(--spectrum2-sidekick-border-color);
  }

  .container .row .status {
    width: 20px;
    display: flex;
    align-items: center;
    color: var(--spectrum2-color-positive);
    padding-top: 1px;
  }
  .container .row .status.error {
    color: var(--spectrum2-foreground-color-negative);
  }

  .container .row .path {
    text-overflow: ellipsis;
  }

  .container .row .path a:any-link {
    color: currentColor;
    text-decoration: none;
  }

  .container .row .path a:hover {
    text-decoration: underline;
  }

  .container .row .error {
    display: flex;
    flex-direction: row;
    align-items: center;
    color: var(--spectrum2-foreground-color-negative);
    white-space: normal;
  }

  .container .row .error svg {
    margin-right: 4px;
  }

  .container sp-menu-divider:first-child {
    fill: red;
  }

  .container sp-menu-divider:last-child {
    display: none;
  }
`;
