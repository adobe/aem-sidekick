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

export const spectrum2 = css`
  :host {
    --preview-background-default-light: #EEFAFEFF;
    --preview-background-default-dark: #002B3BFF;
    --preview-background-hover-light: #D9F4FDFF;
    --preview-background-hover-dark: #00394EFF;
    --preview-content-default-light: #1286CDFF;
    --preview-content-default-dark: #5CC0FFFF;
    --preview-border-default-light: #B7E7FCFF;
    --preview-border-default-dark: #004762FF;
    --preview-border-hover-light: #5CC0FFFF;
    --preview-border-hover-dark: #046691FF;
    --preview-border-open-light: #30A7FEFF;
    --preview-border-open-dark: #0b78b300;
    --live-content-default-light: #079355FF;
    --live-content-default-dark: #2BD17DFF;
    --live-background-default-light: #EDFCF1FF;
    --live-background-default-dark: #002E22FF;
    --live-background-hover-light: #D7F7E1FF;
    --live-background-hover-dark: #003D2CFF;
    --live-border-default-light: #ADEEC5FF;
    --live-border-default-dark: #014C34FF;
    --live-border-hover-light: #2BD17DFF;
    --live-border-hover-dark: #036E45FF;
    --live-border-open-light: #12B867FF;
    --live-border-open-dark: #05834EFF;
    --edit-content-default-light: #292929FF;
    --edit-content-default-dark: #DADADAFF;
    --edit-background-default-light: #F8F8F8FF;
    --edit-background-default-dark: #292929FF;
    --edit-background-hover-light: #F3F3F3FF;
    --edit-background-hover-dark: #292929FF;
    --edit-border-default-light: #DADADAFF;
    --edit-border-default-dark: #505050FF;
    --edit-border-hover-light: #C6C6C6FF;
    --edit-border-hover-dark: #717171FF;
    --edit-border-open-light: #8F8F8FFF;
    --edit-border-open-dark: #8F8F8FFF;

    --sidekick-background-light: #FFFFFFCC;
    --sidekick-background-dark: #222222CC;
    --sidekick-background-layer1-dark: #1B1B1B;
    --sidekick-background-layer1-light: #F8F8F8;
    --sidekick-background-layer2-dark: #2C2C2C;
    --sidekick-background-layer2-light: #E9E9E9;
    --sidekick-background-pasteboard-dark: #111111;
    --sidekick-background-pasteboard-light: #ffffff;
    --sidekick-border-color-dark: #393939;
    --sidekick-border-color-light: #DADADA;
    --spectrum2-color-positive: #05834E;
    --spectrum2-color-info: #3B63FB;
    --spectrum2-action-button-selected-light: #292929FF;
    --spectrum2-action-button-selected-dark: #DADADAFF;
    --spectrum2-color-negative-light: #D73220;
    --spectrum2-color-negative-dark: #FC432E;
    --spectrum2-menu-item-background-color-hover-light: rgba(0, 0, 0, 0.05);
    --spectrum2-menu-item-background-color-hover-dark: rgba(255, 255, 255, 0.05);
    --sidekick-max-width: 640px;

    --spectrum2-edit-content-default: var(--edit-content-default-dark);
    --spectrum2-edit-background-default: var(--edit-background-default-dark);
    --spectrum2-edit-background-hover: var(--edit-background-hover-dark);
    --spectrum2-edit-border-default: var(--edit-border-default-dark);
    --spectrum2-edit-border-hover: var(--edit-border-hover-dark);
    --spectrum2-edit-border-open: var(--edit-border-open-dark);
    --spectrum2-color-negative: var(--spectrum2-color-negative-dark);

    --spectrum2-preview-background-default: var(--preview-background-default-dark);
    --spectrum2-preview-background-hover: var(--preview-background-hover-dark);
    --spectrum2-preview-content-default: var(--preview-content-default-dark);
    --spectrum2-preview-border-default: var(--preview-border-default-dark);
    --spectrum2-preview-border-hover: var(--preview-border-hover-dark);
    --spectrum2-preview-border-open: var(--preview-border-open-dark);

    --spectrum2-live-content-default: var(--live-content-default-dark);
    --spectrum2-live-background-default: var(--live-background-default-dark);
    --spectrum2-live-background-hover: var(--live-background-hover-dark);
    --spectrum2-live-border-default: var(--live-border-default-dark);
    --spectrum2-live-border-hover: var(--live-border-hover-dark);
    --spectrum2-live-border-open: var(--live-border-open-dark);

    --spectrum2-action-button-selected: var(--spectrum2-action-button-selected-dark);

    --spectrum2-small-border-radius: 4px;
    --spectrum2-default-border-radius: 8px;
    --spectrum2-medium-border-radius: 10px;
    --spectrum2-large-border-radius: 12px;
    --spectrum2-xlarge-border-radius: 14px;
    --spectrum2-xxlarge-border-radius: 16px;
    --spectrum2-form-input-border-radius: var(--spectrum2-medium-border-radius);
    --spectrum2-dialog-border-radius: var(--spectrum2-xxlarge-border-radius);
    --spectrum2-sidekick-border-radius: var(--spectrum2-large-border-radius);

    --spectrum2-sidekick-background: var(--sidekick-background-dark);
    --spectrum2-sidekick-layer-1: var(--sidekick-background-layer1-dark);
    --spectrum2-sidekick-layer-2: var(--sidekick-background-layer2-dark);
    --spectrum2-sidekick-background-pasteboard: var(--sidekick-background-pasteboard-dark);
    --spectrum2-sidekick-border-color: var(--sidekick-border-color-dark);
    --spectrum2-sidekick-menu-item-background-color-hover: var(--spectrum2-menu-item-background-color-hover-dark);
    --spectrum2-sidekick-backdrop-filter: blur(24px);
    --spectrum2-sidekick-box-shadow:
      0px 0px 3px 0px rgba(0, 0, 0, 0.12),
      0px 3px 8px 0px rgba(0, 0, 0, 0.04),
      0px 4px 16px 0px rgba(0, 0, 0, 0.08);

    --mod-toast-corner-radius: var(--spectrum2-large-border-radius);
    --mod-toast-divider-color: transparent;
    --mod-toast-max-inline-size: var(--sidekick-max-width);
    --mod-actionbutton-border-radius: var(--spectrum2-default-border-radius);

    --mod-popover-corner-radius: var(--spectrum2-xlarge-border-radius);
    --mod-popover-animation-distance: 20px;
    --mod-popover-background-color: var(--spectrum2-sidekick-background);
    --mod-popover-border-color: var(--spectrum2-sidekick-border-color);
    --mod-menu-item-background-color-hover: var(--spectrum2-sidekick-menu-item-background-color-hover);

    --mod-divider-background-color: var(--spectrum2-sidekick-border-color);
  }

  @media (prefers-color-scheme: light) {
    :host {
      --spectrum2-preview-background-default: var(--preview-background-default-light);
      --spectrum2-preview-background-hover: var(--preview-background-hover-light);
      --spectrum2-preview-content-default: var(--preview-content-default-light);
      --spectrum2-preview-border-default: var(--preview-border-default-light);
      --spectrum2-preview-border-hover: var(--preview-border-hover-light);
      --spectrum2-preview-border-open: var(--preview-border-open-light);

      --spectrum2-live-content-default: var(--live-content-default-light);
      --spectrum2-live-background-default: var(--live-background-default-light);
      --spectrum2-live-background-hover: var(--live-background-hover-light);
      --spectrum2-live-border-default: var(--live-border-default-light);
      --spectrum2-live-border-hover: var(--live-border-hover-light);
      --spectrum2-live-border-open: var(--live-border-open-light);

      --spectrum2-edit-content-default: var(--edit-content-default-light);
      --spectrum2-edit-background-default: var(--edit-background-default-light);
      --spectrum2-edit-background-hover: var(--edit-background-hover-light);
      --spectrum2-edit-border-default: var(--edit-border-default-light);
      --spectrum2-edit-border-hover: var(--edit-border-hover-light);
      --spectrum2-edit-border-open: var(--edit-border-open-light);

      --spectrum2-sidekick-background: var(--sidekick-background-light);
      --spectrum2-sidekick-layer-1: var(--sidekick-background-layer1-light);
      --spectrum2-sidekick-layer-2: var(--sidekick-background-layer2-light);
      --spectrum2-sidekick-background-pasteboard: var(--sidekick-background-pasteboard-light);
      --spectrum2-sidekick-border-color: var(--sidekick-border-color-light);
      --spectrum2-sidekick-menu-item-background-color-hover: var(--spectrum2-menu-item-background-color-hover-light);

      --spectrum2-action-button-selected: var(--spectrum2-action-button-selected-light);

      --spectrum2-color-negative: var(--spectrum2-color-negative-light);
    }
  }
`;
