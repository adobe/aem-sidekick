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

/* eslint-disable wc/no-constructor-params */

import { LitElement } from 'lit';
import { consume } from '@lit/context';
import { appStoreContext } from '../../store/app.js';

/**
 * @typedef {import('@AppStore').AppStore} AppStore
 */

/**
 * Base class for any components that needs access the appStore
 * @extends {LitElement}
 * @class ConnectedElement
 */
export class ConnectedElement extends LitElement {
  /**
   * @type {AppStore}
   */
  @consume({ context: appStoreContext })
  accessor appStore;
}
