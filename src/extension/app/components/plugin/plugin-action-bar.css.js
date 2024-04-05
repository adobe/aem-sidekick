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

  action-bar sp-action-group > svg {
    width: 32px;
    height: 32px;
  }
`;
