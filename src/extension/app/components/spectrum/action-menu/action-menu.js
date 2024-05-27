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

// @ts-nocheck
/* istanbul ignore file */

import { css } from '@spectrum-web-components/base';
import { ActionMenu as SPActionMenu } from '@spectrum-web-components/action-menu';

export class ActionMenu extends SPActionMenu {
  static get styles() {
    return [
      ...super.styles,
      css`
        sp-popover {
          box-shadow: 
            0px 0px 3px rgba(0, 0, 0, 0.12), 
            0px 3px 8px rgba(0, 0, 0, 0.04), 
            0px 4px 16px rgba(0, 0, 0, 0.08);
          backdrop-filter: var(--spectrum2-sidekick-backdrop-filter);
          filter: unset;
        }

        sp-action-button[selected] {
          background-color: rgba(0, 0, 0, 0.05);
          color: var(--spectrum2-action-button-selected);
        }
      `,
    ];
  }
}

customElements.define('sp-action-menu', ActionMenu);
