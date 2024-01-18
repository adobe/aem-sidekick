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
  :host(:not(.edit)[class]) #button {
    border: 0;
  }

  :host(.preview) #button{
    background-color: var(--spectrum-blue-600);
  }

  :host(.preview) #button[aria-expanded="true"] {
    background-color: var(--spectrum-blue-500);
  }

  :host(.live) #button,
  :host(.prod) #button {
    background-color: var(--spectrum-celery-700);
  }

  :host(.live) #button[aria-expanded="true"],
  :host(.prod) #button[aria-expanded="true"] {
    background-color: var(--spectrum-celery-600);
  }

  :host(.edit) #button{
    border: 1px solid var(--spectrum-gray-400);
  }

  :host(.plugin-container) #button {
    background-color: transparent;
  }

  :host(.plugin-container) #button[aria-expanded="true"] {
    background-color: var(--spectrum-gray-400);
  }

  sp-menu {
    padding: 8px;
    gap: 4px;
  }

  @media (prefers-color-scheme: light) {
    :host(:not(.edit)[class]) #button #label,
    :host(:not(.edit)[class]) #button sp-icon-chevron100,
    :host(:not(.edit)[class]) #button:hover sp-icon-chevron100  {
      color: var(--spectrum-white);
    }

    :host(.preview) #button{
      background-color: var(--spectrum-blue-900);
    }

    :host(.preview) #button[aria-expanded="true"] {
      background-color: var(--spectrum-blue-1000);
    }

    :host(.live) #button,
    :host(.prod) #button {
      background-color: var(--spectrum-celery-800);
    }

    :host(.live) #button[aria-expanded="true"],
    :host(.prod) #button[aria-expanded="true"] {
      background-color: var(--spectrum-celery-900);
    }

    :host(.edit) #button{
      border: 1px solid var(--spectrum-gray-200);
    }
  }
`;
