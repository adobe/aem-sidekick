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
  .wait-dialog {
    display: flex;
    align-items: center;
    gap: 24px;
  }

  .wait-dialog span {
    font-size: 1.125rem;
  }

  sp-dialog-wrapper sp-textfield {
    width: 100%;
  }

  sp-dialog-wrapper .delete-input {
    padding-top: 8px;
  }

  sp-dialog-wrapper .delete-input sp-help-text {
    display: none;
    font-size: 12px;
    padding-top: 4px;
    color: var(--spectrum-negative-color-900);
  }

  sp-dialog-wrapper .delete-input.invalid sp-help-text {
    display: block;
  }
`;
