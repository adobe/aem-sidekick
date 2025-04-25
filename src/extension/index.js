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
import '@spectrum-web-components/theme/sp-theme.js';
import '@spectrum-web-components/theme/spectrum-two/theme-light-core-tokens.js';
import '@spectrum-web-components/theme/spectrum-two/theme-dark-core-tokens.js';
import '@spectrum-web-components/theme/spectrum-two/scale-medium-core-tokens.js';
import '@spectrum-web-components/action-button/sp-action-button.js';
import '@spectrum-web-components/action-group/sp-action-group.js';
import '@spectrum-web-components/divider/sp-divider.js';
import '@spectrum-web-components/dialog/sp-dialog-base.js';
import '@spectrum-web-components/menu/sp-menu-divider.js';
import '@spectrum-web-components/overlay/sp-overlay.js';
import '@spectrum-web-components/overlay/overlay-trigger.js';
import '@spectrum-web-components/popover/sp-popover.js';
import '@spectrum-web-components/picker/sp-picker.js';
import '@spectrum-web-components/status-light/sp-status-light.js';
import '@spectrum-web-components/switch/sp-switch.js';
import '@spectrum-web-components/tabs/sp-tabs.js';
import '@spectrum-web-components/tabs/sp-tab.js';
import '@spectrum-web-components/textfield/sp-textfield.js';
import '@spectrum-web-components/icon/sp-icon.js';
import '@spectrum-web-components/badge/sp-badge.js';

import './app/components/action-bar/action-bar.js';
import './app/components/action-bar/picker/picker.js';
import './app/components/action-bar/menu-item/menu-item.js';
import './app/components/theme/theme.js';
import './app/components/plugin/plugin-action-bar.js';
import './app/components/plugin/palette-container.js';
import './app/components/plugin/env-switcher/env-switcher.js';
import './app/components/plugin/login/login.js';
import './app/components/dialog-wrapper/dialog-wrapper.js';
import './app/components/spectrum/action-menu/action-menu.js';
import './app/components/spectrum/menu-group/menu-group.js';
import './app/components/spectrum/progress-circle/progress-circle.js';
import './app/components/bulk/bulk-result/bulk-result.js';
import './app/components/onboarding/onboarding-dialog.js';

import { AEMSidekick } from './app/aem-sidekick.js';
import { AEMConfigPicker } from './app/config-picker.js';

export { AEMSidekick, AEMConfigPicker };
