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
    overflow: hidden;
  }

  .header {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 64px;
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

  .actions .checkbox-label {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 0 10px;
  }

  .actions .checkbox-label input {
    margin: 0;
  }

  .actions sp-switch {
    padding: 0 10px;
  }
   
  .tableContainer {
    padding-top: 15px;
    width: 100%;
    height: 100%;
  }

  .tableContainer.loading {
    display: none;
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

  sp-theme[color='light'] sp-table-row {
    --mod-table-row-background-color-hover: rgb(255, 255, 255);
  }

  sp-theme[color='light'] .header sp-search {
    --mod-textfield-background-color: #ffffff;
  }

  sp-table-head {
    min-height: fit-content;
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

  sp-table-head-cell.column-with-copy {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .header-with-copy {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    width: 100%;
    min-width: 0;
  }

  .header-with-copy span {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }

  .copy-column-btn {
    background: transparent;
    border: none;
    padding: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    flex-shrink: 0;
    transition: all 0.2s ease;
    color: var(--spectrum2-sidekick-color);
  }

  .copy-column-btn:hover {
    background-color: var(--spectrum2-sidekick-layer-2);
  }

  .copy-column-btn:active {
    background-color: var(--spectrum2-sidekick-border-color);
  }

  .copy-column-btn.success {
    color: #2d9d78;
  }

  .copy-column-btn.success:hover {
    background-color: transparent;
  }

  .copy-column-btn sp-icon-copy,
  .copy-column-btn sp-icon-checkmark-circle {
    width: 16px;
    height: 16px;
  }

  theme-wrapper[theme='light'] .copy-column-btn:hover {
    background-color: rgba(0, 0, 0, 0.06);
  }

  theme-wrapper[theme='light'] .copy-column-btn:active {
    background-color: rgba(0, 0, 0, 0.1);
  }

  theme-wrapper[theme='light'] .copy-column-btn.success {
    color: #268e6c;
  }

  theme-wrapper[theme='light'] .copy-column-btn.success:hover {
    background-color: transparent;
  }

  sp-table-cell {
    background-color: transparent;
    word-break: break-word;
    min-width: 150px;
  }

  .line {
    min-width: 90px;
    max-width: 90px;
    text-align: right;
    white-space: nowrap;
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

  /* Diff row styles */
  .diff-value {
    padding: 0.5rem;
    border-radius: 4px;
  }

  .diff-row {
    background-color: var(--spectrum-global-color-gray-100);
  }

  .diff-row a {
    color: var(--spectrum-white-color);
  }

  .diff-row.added, sp-table-row:has([data-diff="added"]) {
    background-color: #aceebb;
  }

  .diff-row.removed, sp-table-row:has([data-diff="removed"]) {
    background-color: #ffcecb;
  }

  theme-wrapper[theme='dark'] .diff-row.added, theme-wrapper[theme='dark'] sp-table-row:has([data-diff="added"]) {
    background-color: #3fb9504d;
  }

  theme-wrapper[theme='dark'] .diff-row.removed, theme-wrapper[theme='dark'] sp-table-row:has([data-diff="removed"]) {
    background-color: #f851494d;
  }

  .loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .loading-overlay p {
    color: var(--spectrum-white-color);
    margin-top: 16px;
    font-size: 14px;
  }

  theme-wrapper[theme='dark'] .loading-overlay {
    background-color: rgba(0, 0, 0, 0.7);
  }

  sp-table-cell[data-diff="added"]::before {
    content: "+";
    color: var(--spectrum-semantic-positive-color-default);
    margin-right: 8px;
    font-weight: bold;
  }

  sp-table-cell[data-diff="removed"]::before {
    content: "−";
    color: var(--spectrum-semantic-negative-color-default);
    margin-right: 8px;
    font-weight: bold;
  }
`;
