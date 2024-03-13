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
  .confirm-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
    position: absolute;
    top: 0;
    left: 0;
    align-items: center;
    justify-content: center;
    align-content: center;
    width: 100vw;
    height: 100vh;
  }

  sp-alert-dialog {
    background: var(--spectrum-background-base-color);
  }
`;
