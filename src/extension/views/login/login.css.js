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

  .header {
    display: flex;
    align-items: center;
    gap: 10px;
    height: 64px;
    padding-left: 16px;
    padding-right: 16px;
    background-color: var(--spectrum2-sidekick-layer-1);
  }

  .header .left {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 324px;
  }

  .header .center {
    flex: 2;
    display: flex;
    justify-content: center;
    min-width: 175px;
  }

  .header .right {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 10px;
    justify-content: flex-end;
    min-width: 30px;
  }

  .header svg {
    width: 32px;
    height: 32px;
  }

  .header h1 {
    font-size: 14px;
    font-weight: 400;
    flex-grow: 1;
  }

  .header h1 span {
    padding-left: 5px;
    font-weight: 700;
  }

  .header sp-search {
    width: 100%;
    max-width: 400px;
    --mod-textfield-corner-radius: var(--spectrum2-xxlarge-border-radius);
    --mod-textfield-border-width: 2px;
    --mod-textfield-border-color: var(--spectrum2-sidekick-border-color);
    --mod-textfield-background-color: var(--spectrum2-sidekick-background-pasteboard);
    --mod-textfield-focus-indicator-color: var(--spectrum2-color-focus);
  }

  .header button {
    background-color: transparent;
    border: none;
    border-radius: 50%;
    width: 32px;
    height: 32px;
  }

  .header button:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  .header button:active {
    background-color: rgba(255, 255, 255, 0.2);
  }

  .actions {
    padding: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .actions sp-action-group {
    background-color: var(--spectrum2-sidekick-layer-2);
    padding: 2px;
    border-radius: var(--spectrum2-default-border-radius);
  }

  .actions sp-action-group sp-action-button {
    border-radius: 6px;
    border: 0px;
  }

  .actions sp-action-group sp-action-button{
    background-color: transparent;
  }

  .actions sp-action-group sp-action-button[selected] {
    background-color: var(--spectrum2-sidekick-background-pasteboard);
    color: var(--spectrum-white-color);
  }

  .actions .stats {
    display: flex;
    justify-content: flex-end;
  }

  .tableContainer {
    padding-top: 15px;
    width: 100%;
    height: 100%;
  }

  .tableContainer .tableHeader {
    display: flex;
    align-items: center;
  }

  .tableContainer .tableHeader h2 {
    flex-grow: 1;
  }

  sp-table-row {
    --mod-table-row-background-color-hover: rgb(29, 29, 29);
  }

  sk-theme[color='light'] sp-table-row {
    --mod-table-row-background-color-hover: rgb(255, 255, 255);
  }

  sk-theme[color='light'] .header sp-search {
    --mod-textfield-background-color: #ffffff;
  }

  sp-table-head {
    overflow-x: scroll;
  }

  sp-table-head::-webkit-scrollbar {
    display: none;
  }

  sp-table-head-cell {
    min-width: 150px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  sp-table-cell {
    background-color: transparent;
    word-break: break-word;
    min-width: 150px;
  }

  sp-table-cell a {
    color: var(--spectrum-accent-content-color-default);
  }

  sp-table-cell a:hover {
    color: var(--spectrum-accent-content-color-hover);
  }

  sp-table-cell a:active {
    color: var(--spectrum-accent-content-color-down);
  }

  sp-table-cell a:focus {
    color: var(--spectrum-accent-content-color-key-focus);
  }

  sp-table-cell ul {
    padding-inline-start: 10px;
    margin-block-start: 0;
  }

  sp-table-cell > div.image,
  sp-table-cell > div.video {
    padding: 0;
  }

  sp-table-cell > div img,
  sp-table-cell > div video {
    width: 100%;
    max-width: 240px;
    border-radius: var(--spectrum2-default-border-radius);
  }

  sp-table-body {
    border: 0;
    border-top: 1px solid var(--spectrum2-sidekick-border-color);
    background-color: transparent;
  }

  @media (min-width: 600px) {

  }

  @media (min-width: 900px) {
    .header .right {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 10px;
      justify-content: flex-end;
      min-width: 324px;
    }
  }
`;
