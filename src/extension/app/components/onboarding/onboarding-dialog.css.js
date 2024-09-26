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
  :host {
    color: var(--spectrum-global-color-gray-800);
    --mod-modal-background-color: transparent;
    --mod-tabs-start-to-edge: 20px;
  }

  sp-dialog-base {
    inline-size: 94vw;
    left: 50%;
    transform: translateX(-50%);
  }

  .container {
    display: grid;
    grid-template-columns: 288px auto;
    grid-template-rows: auto 1fr auto;
    max-height: 640px;
    background-color: var(--spectrum2-sidekick-layer-1);
    border-radius: var(--spectrum2-xlarge-border-radius);
    overflow: hidden;
    box-shadow: 0px 2px 8px 0px rgba(0, 0, 0, 0.16);
  }

  .container nav {
    padding: 20px;
    margin-top: 40px;
    margin-left: 40px;
    margin-right: 18px;
  }

  .container nav .heading {
    font-size: 22px;
    font-weight: 700;
    margin-bottom: 24px;
  }

  .container > div {
    overflow: hidden;    
  }

  .container > div sp-button {
    position: absolute;
    right: 40px;
    bottom: 40px;
  }

  :host #close-button {
    position: absolute;
    right: -30px;
    top: -30px;
  }

  .content {
    display: grid;
    grid-template-rows: auto 1fr auto;
    background-color: var(--spectrum2-sidekick-background-pasteboard);
  }

  .content div:nth-of-type(1) img {
    width: 100%;
    height: 140px;
    object-fit: scale-down;
  }

  .content div:nth-of-type(2){
    padding: 40px;
    margin-bottom: 60px;
  }

  .content div:nth-of-type(2) h1 {
    font-size: 18px;
    margin: 0;
  }

  .content div:nth-of-type(2) p {
    font-size: 16px;
  }

  @media (min-height: 600px) {
    .content div:nth-of-type(1) img {
      height: 260px;
    }
  }

  @media (min-height: 800px) {
    .content div:nth-of-type(1) img {
      height: 360px;
    }
  }

  @media (max-width: 768px) {
    .container {
      grid-template-columns: 1fr;
      grid-template-rows: auto auto 1fr auto;
    }

    .container nav {
      display: none;
    }
  }

  @media (min-width: 1000px) {
    sp-dialog-base {
      inline-size: initial;
      width: 942px;
    }

    .content div:nth-of-type(1) img {
      object-fit: none;
    }
  }
`;
