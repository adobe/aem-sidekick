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
    min-width: 360px;
    max-width: 640px;
    max-height: 284px;
    overflow-y: scroll;
    user-select: text;
  }

  .container .resource {
    min-height: 36px;
    white-space: nowrap;
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    align-items: center;
    gap: 8px;
  }

  .container .resource .status {
    flex-shrink: 1;
    display: flex;
    align-items: center;
    color: var(--spectrum2-color-positive);
  }

  .container .resource .status.error {
    color: var(--spectrum2-foreground-color-negative);
  }

  .container .resource .path {
    text-overflow: ellipsis;
  }

  .container .resource .path a:any-link {
    color: currentColor;
    text-decoration: none;
  }

  .container .resource .path a:hover {
    text-decoration: underline;
  }

  .container .resource .error {
    display: flex;
    flex-direction: row;
    align-items: center;
    color: var(--spectrum2-foreground-color-negative);
    white-space: normal;
  }

  .container .resource .error svg {
    margin-right: 4px;
  }

  .container sp-menu-divider:last-child {
    display: none;
  }
`;
