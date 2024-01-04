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
  .action-bar {
    display: flex;
    border-radius: 8px;
    color: var(--spectrum-global-color-gray-800);
    background-color: var(--spectrum-global-color-gray-200);
    border: 1px solid var(--spectrum-global-color-gray-300);
  }

  .action-bar sp-action-group {
    padding: 8px;
  }

  @media (prefers-color-scheme: light) {
    .action-bar {
      background-color: var(--spectrum-global-color-gray-100);
    }
  }
`;
