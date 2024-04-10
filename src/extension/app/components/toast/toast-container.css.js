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
  .toast-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
    position: absolute;
    left: 50%;
    transform: translate(-50%, 0px);
    bottom: 90px;
    align-items: center;
    min-width: var(--sidekick-min-width);
    max-width: var(--sidekick-max-width);
  }

  .toast-container sp-toast {
    width: 100%;
  }
`;
