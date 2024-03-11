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

import '@spectrum-web-components/theme/scale-medium.js';
import '@spectrum-web-components/theme/theme-dark.js';
import '@spectrum-web-components/theme/theme-light.js';
import '@spectrum-web-components/theme/sp-theme.js';
import '@spectrum-web-components/action-button/sp-action-button.js';
import '@spectrum-web-components/action-group/sp-action-group.js';
import '@spectrum-web-components/divider/sp-divider.js';
import '@spectrum-web-components/toast/sp-toast.js';
import '@spectrum-web-components/dialog/sp-dialog-base.js';
import '@spectrum-web-components/dialog/sp-dialog-wrapper.js';
import '@spectrum-web-components/progress-circle/sp-progress-circle.js';
import '@spectrum-web-components/action-menu/sp-action-menu.js';
import '@spectrum-web-components/menu/sp-menu-group.js';
import '@spectrum-web-components/menu/sp-menu-divider.js';
import '@spectrum-web-components/overlay/sp-overlay.js';
import '@spectrum-web-components/picker/sp-picker.js';
import '@spectrum-web-components/status-light/sp-status-light.js';
import '@spectrum-web-components/icon/sp-icon.js';

import '@spectrum-web-components/icons-workflow/icons/sp-icon-user.js';
import '@spectrum-web-components/icons-workflow/icons/sp-icon-log-out.js';

import './app/components/action-bar/action-bar.js';
import './app/components/action-bar/picker/picker.js';
import './app/components/action-bar/menu-item/menu-item.js';
import './app/components/theme/theme.js';
import './app/components/plugin/plugin-action-bar.js';
import './app/components/modal/modal-container.js';
import './app/components/toast/toast-container.js';
import './app/components/plugin/palette-container.js';
import './app/components/plugin/palette-dialog/palette-dialog-wrapper.js';
import './app/components/plugin/palette-dialog/palette-dialog.js';
import './app/components/plugin/env-switcher/env-switcher.js';
import './app/components/plugin/config-switcher/config-switcher.js';
import './app/components/plugin/login/login.js';
import './app/components/dialog/dialog.js';

import { AEMSidekick } from './app/aem-sidekick.js';
import { AEMConfigPicker } from './app/config-picker.js';

export { AEMSidekick, AEMConfigPicker };
