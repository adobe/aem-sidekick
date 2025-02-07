/*
 * Copyright 2025 Adobe. All rights reserved.
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
    pointer-events: auto;
  }

  .container {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    color: var(--spectrum2-sidekick-color);
    box-sizing: border-box;
    margin-bottom: 40px;
  }

  .container .content {
    width: 90vw;
    max-width: 420px;
    height: 378px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
    
  sp-icon {
    position: relative;
    padding: 0;
    width: 164px;
    height: 164px;
  }

  sp-icon svg {
    width: 100%;
    height: 100%;
  }
    
  h2, span {
    margin: 0 0 16px;
  }

  span {
    font-size: 16px;
    line-height: 20px;
  }
`;
