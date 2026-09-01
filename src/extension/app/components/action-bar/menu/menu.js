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

import { Menu as SPMenu } from '@spectrum-web-components/menu';

/**
 * Sidekick wrapper around the Spectrum Menu.
 *
 * Registered under a unique tag so it never resolves against a host page's
 * global custom-element registry. Pages that define their own `sp-menu`
 * (e.g. Milo's merch-card-collection) would otherwise take over the
 * Sidekick's menu and break selection.
 */
export class Menu extends SPMenu {}

customElements.define('sk-menu', Menu);
