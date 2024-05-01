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

import { html } from 'lit';

/**
 * Mapping between the plugin IDs that will be treated as environments
 * and their corresponding host properties in the config.
 * @private
 * @type {Object}
 */
export const ENVS = {
  edit: 'edit',
  dev: 'localhost',
  preview: 'innerHost',
  live: 'outerHost',
  prod: 'host',
};

/**
 * Internal event types
 * @enum {string}
 */
export const EVENTS = {
  OPEN_PALETTE: 'open-palette',
  CLOSE_PALETTE: 'close-palette',
};

/**
 * External event types
 * @enum {string}
 */
export const EXTERNAL_EVENTS = {
  CONTEXT_LOADED: 'contextloaded',
  STATUS_FETCHED: 'statusfetched',
  RESOURCE_UPDATED: 'updated',
  RESOURCE_PREVIEWED: 'previewed',
  RESOURCE_DELETED: 'deleted',
  RESOURCE_PUBLISHED: 'published',
  RESOURCE_UNPUBLISHED: 'unpublished',
  EVIRONMENT_SWITCHED: 'envswitched',
  PLUGIN_USED: 'pluginused',
};

/**
 * Modal types
 * @enum {string}
 */
export const MODALS = {
  ERROR: 'error',
  DELETE: 'delete',
};

/**
 * Modal Events
 * @enum {string}
 */
export const MODAL_EVENTS = {
  CLOSE: 'close',
  CANCEL: 'cancel',
  SECONDARY: 'secondary',
  CONFIRM: 'confirm',
};

/**
 * Toast Events
 * @enum {string}
 */
export const TOAST_EVENTS = {
  CLOSE: 'close',
};

/**
 * Array of restricted paths with limited sidekick functionality.
 * @private
 * @type {string[]}
 */
export const RESTRICTED_PATHS = [
  '/helix-env.json',
];

/**
 * Enum for sidekick states.
 * @enum {string}
 */
export const STATE = {
  INITIALIZING: 'initializing_state',
  FETCHING_STATUS: 'fetching_status_state',
  LOGIN_REQUIRED: 'login_required_state',
  LOGGING_IN: 'logging_in_state',
  LOGGING_OUT: 'logging_out_state',
  UNAUTHORIZED: 'unauthorized_state',
  PREVIEWING: 'previewing_state',
  PUBLISHNG: 'publishing_state',
  UNPUBLISHING: 'unpublishing_state',
  DELETING: 'deleting_state',
  TOAST: 'toast_state',
  READY: 'ready_state',
};

/**
 * The SVG icons.
 * @type {Object<string, import("lit").TemplateResult>}
 */
export const ICONS = {
  ADOBE_LOGO: html`
    <svg width="250" height="245" viewBox="0 0 250 245" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M47.5 3H202.5C226 3 245 22 245 45.5V194.5C245 218 226 237 202.5 237H47.5C24 237 5 218 5 194.5V45.5C5 22 24 3 47.5 3Z" fill="black"/>
      <path d="M192 179H163C160.3 179.2 157.9 177.5 157 175L126 103C126 102.4 125.6 102 125 102C124.4 102 124 102.4 124 103L104 149C104 150.1 104.9 151 106 151H127C128.3 150.9 129.6 151.7 130 153L139 174C139.6 176.1 138.4 178.3 136.2 178.9C136.1 178.9 136 178.9 136 179H59C56.8 178.5 55.5 176.4 55.9 174.2C55.9 174.1 55.9 174 56 174L105 57C106.1 54.7 108.4 53.1 111 53H139C141.6 53.1 143.9 54.7 145 57L195 174C195.6 176.1 194.4 178.3 192.2 178.9C192.2 179 192.1 179 192 179Z" fill="#FA0F00"/>
    </svg>`,
  PROPERTIES: html`
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1.5749 6.09414H3.97673C4.28331 7.3813 5.43588 8.34414 6.81538 8.34414C8.19487 8.34414 9.34746 7.3813 9.65402 6.09414H16.4249C16.7975 6.09414 17.0999 5.79179 17.0999 5.41914C17.0999 5.04649 16.7975 4.74414 16.4249 4.74414H9.65402C9.34745 3.45698 8.19487 2.49414 6.81538 2.49414C5.43588 2.49414 4.2833 3.45698 3.97673 4.74414H1.5749C1.20225 4.74414 0.899902 5.04649 0.899902 5.41914C0.899902 5.79179 1.20225 6.09414 1.5749 6.09414ZM6.81538 3.84414C7.68373 3.84414 8.39038 4.55078 8.39038 5.41914C8.39038 6.2875 7.68373 6.99414 6.81538 6.99414C5.94702 6.99414 5.24038 6.2875 5.24038 5.41914C5.24038 4.55078 5.94702 3.84414 6.81538 3.84414Z" fill="currentColor"/>
      <path d="M16.4249 11.9443H14.154C13.8475 10.6572 12.6949 9.69434 11.3154 9.69434C9.93589 9.69434 8.78331 10.6572 8.47674 11.9443H1.5749C1.20225 11.9443 0.899902 12.2467 0.899902 12.6193C0.899902 12.992 1.20225 13.2943 1.5749 13.2943H8.47673C8.78331 14.5815 9.93588 15.5443 11.3154 15.5443C12.6949 15.5443 13.8475 14.5815 14.154 13.2943H16.4249C16.7975 13.2943 17.0999 12.992 17.0999 12.6193C17.0999 12.2467 16.7976 11.9443 16.4249 11.9443ZM11.3154 14.1943C10.447 14.1943 9.74038 13.4877 9.74038 12.6193C9.74038 11.751 10.447 11.0443 11.3154 11.0443C12.1837 11.0443 12.8904 11.751 12.8904 12.6193C12.8904 13.4877 12.1837 14.1943 11.3154 14.1943Z" fill="currentColor"/>
    </svg>`,
  INFO: html`
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" >
      <path d="M10 18.75C5.1748 18.75 1.25 14.8252 1.25 10C1.25 5.1748 5.1748 1.25 10 1.25C14.8252 1.25 18.75 5.1748 18.75 10C18.75 14.8252 14.8252 18.75 10 18.75ZM10 2.75C6.00195 2.75 2.75 6.00195 2.75 10C2.75 13.998 6.00195 17.25 10 17.25C13.998 17.25 17.25 13.998 17.25 10C17.25 6.00195 13.998 2.75 10 2.75Z" fill="currentColor"/>
      <path d="M10.0006 5.26033C10.2313 5.2522 10.456 5.3342 10.6273 5.48895C10.9576 5.854 10.9576 6.40997 10.6273 6.77502C10.4579 6.93353 10.2324 7.0181 10.0006 7.01006C9.76426 7.01954 9.53472 6.92971 9.36759 6.76231C9.20552 6.59441 9.11843 6.36799 9.12622 6.13476C9.11384 5.89979 9.19581 5.66961 9.35392 5.49536C9.5275 5.33062 9.76179 5.24548 10.0006 5.26033Z" fill="currentColor"/>
      <path d="M10 15.0625C9.58594 15.0625 9.25 14.7266 9.25 14.3125V9.47754C9.25 9.06348 9.58594 8.72754 10 8.72754C10.4141 8.72754 10.75 9.06348 10.75 9.47754V14.3125C10.75 14.7266 10.4141 15.0625 10 15.0625Z" fill="currentColor"/>
    </svg>`,
  CHECKMARK: html`
    <svg width = "20" height = "20" viewBox = "0 0 20 20" fill = "none" xmlns = "http://www.w3.org/2000/svg" >
      <path d="M10 18.75C5.1748 18.75 1.25 14.8252 1.25 10C1.25 5.1748 5.1748 1.25 10 1.25C14.8252 1.25 18.75 5.1748 18.75 10C18.75 14.8252 14.8252 18.75 10 18.75ZM10 2.75C6.00195 2.75 2.75 6.00195 2.75 10C2.75 13.998 6.00195 17.25 10 17.25C13.998 17.25 17.25 13.998 17.25 10C17.25 6.00195 13.998 2.75 10 2.75Z" fill="currentColor"/>
      <path d="M9.18281 13.9434C8.9709 13.9434 8.76777 13.8535 8.62519 13.6953L5.98164 10.7559C5.7043 10.4473 5.72969 9.97363 6.0373 9.69629C6.34491 9.41895 6.81855 9.44434 7.09687 9.75195L9.12324 12.0059L12.8234 6.95996C13.0666 6.62695 13.5354 6.55078 13.8713 6.79883C14.2053 7.04297 14.2775 7.5127 14.0324 7.84668L9.7873 13.6367C9.65449 13.8193 9.4455 13.9316 9.21992 13.9424C9.2082 13.9434 9.19551 13.9434 9.18281 13.9434Z" fill="currentColor"/>
    </svg>`,
  ALERT_TRIANGLE: html`
    <svg width = "20" height = "20" viewBox = "0 0 20 20" fill = "none" xmlns = "http://www.w3.org/2000/svg" >
      <path d="M9.99936 15.1233C9.76871 15.1315 9.54398 15.0496 9.37275 14.895C9.04242 14.5304 9.04242 13.9751 9.37275 13.6104C9.5421 13.4521 9.76758 13.3677 9.99939 13.3757C10.2357 13.3662 10.4653 13.4559 10.6324 13.6231C10.7945 13.7908 10.8816 14.017 10.8738 14.2499C10.8862 14.4846 10.8042 14.7145 10.6461 14.8886C10.4725 15.0531 10.2382 15.1382 9.99936 15.1233Z" fill="currentColor"/>
      <path d="M10 11.75C9.58594 11.75 9.25 11.4141 9.25 11V7C9.25 6.58594 9.58594 6.25 10 6.25C10.4141 6.25 10.75 6.58594 10.75 7V11C10.75 11.4141 10.4141 11.75 10 11.75Z" fill="currentColor"/>
      <path d="M16.7332 18H3.26642C2.46613 18 1.74347 17.5898 1.3338 16.9023C0.924131 16.2148 0.906551 15.3838 1.28741 14.6797L8.02082 2.23242C8.41437 1.50488 9.17268 1.05273 9.99982 1.05273C10.827 1.05273 11.5853 1.50488 11.9788 2.23242L18.7122 14.6797C19.0931 15.3838 19.0755 16.2149 18.6658 16.9024C18.2562 17.5899 17.5335 18 16.7332 18ZM9.99982 2.55273C9.86554 2.55273 9.53205 2.59082 9.34015 2.94531L2.60675 15.3926C2.42364 15.7315 2.55646 16.0244 2.62237 16.1338C2.6878 16.2441 2.88165 16.5 3.26641 16.5H16.7332C17.118 16.5 17.3118 16.2441 17.3773 16.1338C17.4432 16.0244 17.576 15.7315 17.3929 15.3926L10.6595 2.94531C10.4676 2.59082 10.1341 2.55273 9.99982 2.55273Z" fill="currentColor"/>
    </svg>`,
  CLOSE_X: html`
    <svg width = "20" height = "20" viewBox = "0 0 20 20" fill = "none" xmlns = "http://www.w3.org/2000/svg" >
      <mask id="mask0_286_1165" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="20" height="20">
        <path d="M11.0606 10L16.2671 4.79395C16.5601 4.50098 16.5601 4.02637 16.2671 3.7334C15.9741 3.44043 15.4995 3.44043 15.2065 3.7334L10 8.93945L4.79346 3.7334C4.50049 3.44043 4.02588 3.44043 3.73291 3.7334C3.43994 4.02637 3.43994 4.50098 3.73291 4.79395L8.93939 10L3.73291 15.206C3.43994 15.499 3.43994 15.9736 3.73291 16.2666C3.87939 16.4131 4.07129 16.4863 4.26318 16.4863C4.45507 16.4863 4.64697 16.4131 4.79345 16.2666L9.99999 11.0605L15.2065 16.2666C15.353 16.4131 15.5449 16.4863 15.7368 16.4863C15.9287 16.4863 16.1206 16.4131 16.2671 16.2666C16.56 15.9736 16.56 15.499 16.2671 15.206L11.0606 10Z" fill="currentColor"/>
      </mask>
      <g mask="url(#mask0_286_1165)">
        <rect width="20" height="20" fill="currentColor" fill-opacity="0.85"/>
      </g>
    </svg>`,
  USER_ICON: html`
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 1.125C4.65776 1.125 1.125 4.65776 1.125 9C1.125 13.3422 4.65776 16.875 9 16.875C13.3422 16.875 16.875 13.3422 16.875 9C16.875 4.65776 13.3422 1.125 9 1.125ZM9 2.475C12.5978 2.475 15.525 5.4022 15.525 9C15.525 10.4686 15.0314 11.8208 14.2094 12.9125C12.8759 11.7931 10.9813 11.1375 9 11.1375C6.9594 11.1375 5.02421 11.8043 3.78232 12.9014C2.96538 11.8116 2.475 10.4637 2.475 9C2.475 5.4022 5.4022 2.475 9 2.475ZM4.69831 13.8934C5.68982 13.0303 7.31586 12.4875 9 12.4875C10.6176 12.4875 12.2058 13.0199 13.2916 13.9026C12.143 14.9094 10.6437 15.525 9 15.525C7.35144 15.525 5.84819 14.9055 4.69831 13.8934ZM9.0523 10.2599C9.03297 10.2599 9.00088 10.2507 8.99561 10.2595C8.42212 10.2595 7.86358 10.0969 7.3793 9.78881C6.90293 9.48383 6.51401 9.05932 6.25342 8.55923C5.97832 8.03452 5.83726 7.44258 5.84648 6.84887C5.82451 5.70366 6.39536 4.62436 7.37402 3.98452C8.36235 3.35654 9.63105 3.3561 10.6132 3.97968C11.0883 4.2873 11.4768 4.70918 11.7422 5.20224C12.0182 5.71113 12.1605 6.28769 12.1535 6.86777C12.1632 7.4439 12.0226 8.03848 11.7466 8.56714C11.4851 9.06767 11.0962 9.49438 10.622 9.80112C10.1483 10.1026 9.60821 10.2599 9.0523 10.2599ZM9.00879 8.90947H9.01759C9.33091 8.92353 9.63106 8.83168 9.89298 8.6647C10.1676 8.48715 10.3962 8.23623 10.5495 7.94224C10.7218 7.61265 10.8097 7.24175 10.8035 6.87041C10.8079 6.50083 10.7218 6.15235 10.5544 5.84385C10.3957 5.54854 10.1641 5.29717 9.88463 5.11612C9.34806 4.77598 8.64801 4.7751 8.10528 5.11964C7.52565 5.49845 7.18331 6.14577 7.19649 6.8467C7.19077 7.23869 7.27823 7.60651 7.44962 7.9339C7.60254 8.22614 7.82887 8.474 8.10528 8.65066C8.37115 8.81985 8.67921 8.9095 8.99562 8.9095L9.00879 8.90947Z" fill="currentColor"/>
    </svg>
  `,
  DOC_ICON: html`
    <svg width="67" height="93" viewBox="0 0 67 93" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clip-path="url(#clip0_1_33)">
        <mask id="mask0_1_33" style="mask-type:luminance" maskUnits="userSpaceOnUse" x="0" y="0" width="67" height="93">
          <path d="M41.875 0H6.28125C2.82656 0 0 2.85341 0 6.34091V86.6591C0 90.1466 2.82656 93 6.28125 93H60.7187C64.1734 93 67 90.1466 67 86.6591V25.3636L41.875 0Z" fill="white"/>
        </mask>
        <g mask="url(#mask0_1_33)">
          <path d="M41.875 0H6.28125C2.82656 0 0 2.85341 0 6.34091V86.6591C0 90.1466 2.82656 93 6.28125 93H60.7187C64.1734 93 67 90.1466 67 86.6591V25.3636L52.3437 14.7955L41.875 0Z" fill="#4285F4"/>
        </g>
        <mask id="mask1_1_33" style="mask-type:luminance" maskUnits="userSpaceOnUse" x="0" y="0" width="67" height="93">
          <path d="M41.875 0H6.28125C2.82656 0 0 2.85341 0 6.34091V86.6591C0 90.1466 2.82656 93 6.28125 93H60.7187C64.1734 93 67 90.1466 67 86.6591V25.3636L41.875 0Z" fill="white"/>
        </mask>
        <g mask="url(#mask1_1_33)">
          <path d="M43.7123 23.5089L67 47.0126V25.3636L43.7123 23.5089Z" fill="url(#paint0_linear_1_33)"/>
        </g>
        <mask id="mask2_1_33" style="mask-type:luminance" maskUnits="userSpaceOnUse" x="0" y="0" width="67" height="93">
          <path d="M41.875 0H6.28125C2.82656 0 0 2.85341 0 6.34091V86.6591C0 90.1466 2.82656 93 6.28125 93H60.7187C64.1734 93 67 90.1466 67 86.6591V25.3636L41.875 0Z" fill="white"/>
        </mask>
        <g mask="url(#mask2_1_33)">
          <path d="M16.75 67.6364H50.25V63.4091H16.75V67.6364ZM16.75 76.0909H41.875V71.8636H16.75V76.0909ZM16.75 46.5V50.7273H50.25V46.5H16.75ZM16.75 59.1818H50.25V54.9545H16.75V59.1818Z" fill="#F1F1F1"/>
        </g>
        <mask id="mask3_1_33" style="mask-type:luminance" maskUnits="userSpaceOnUse" x="0" y="0" width="67" height="93">
          <path d="M41.875 0H6.28125C2.82656 0 0 2.85341 0 6.34091V86.6591C0 90.1466 2.82656 93 6.28125 93H60.7187C64.1734 93 67 90.1466 67 86.6591V25.3636L41.875 0Z" fill="white"/>
        </mask>
        <g mask="url(#mask3_1_33)">
          <path d="M41.875 0V19.0227C41.875 22.5261 44.6859 25.3636 48.1562 25.3636H67L41.875 0Z" fill="#A1C2FA"/>
        </g>
        <mask id="mask4_1_33" style="mask-type:luminance" maskUnits="userSpaceOnUse" x="0" y="0" width="67" height="93">
          <path d="M41.875 0H6.28125C2.82656 0 0 2.85341 0 6.34091V86.6591C0 90.1466 2.82656 93 6.28125 93H60.7187C64.1734 93 67 90.1466 67 86.6591V25.3636L41.875 0Z" fill="white"/>
        </mask>
        <g mask="url(#mask4_1_33)">
          <path d="M6.28125 0C2.82656 0 0 2.85341 0 6.34091V6.86932C0 3.38182 2.82656 0.528409 6.28125 0.528409H41.875V0H6.28125Z" fill="white" fill-opacity="0.2"/>
        </g>
        <mask id="mask5_1_33" style="mask-type:luminance" maskUnits="userSpaceOnUse" x="0" y="0" width="67" height="93">
          <path d="M41.875 0H6.28125C2.82656 0 0 2.85341 0 6.34091V86.6591C0 90.1466 2.82656 93 6.28125 93H60.7187C64.1734 93 67 90.1466 67 86.6591V25.3636L41.875 0Z" fill="white"/>
        </mask>
        <g mask="url(#mask5_1_33)">
          <path d="M60.7187 92.4716H6.28125C2.82656 92.4716 0 89.6182 0 86.1307V86.6591C0 90.1466 2.82656 93 6.28125 93H60.7187C64.1734 93 67 90.1466 67 86.6591V86.1307C67 89.6182 64.1734 92.4716 60.7187 92.4716Z" fill="#1A237E" fill-opacity="0.2"/>
        </g>
        <mask id="mask6_1_33" style="mask-type:luminance" maskUnits="userSpaceOnUse" x="0" y="0" width="67" height="93">
          <path d="M41.875 0H6.28125C2.82656 0 0 2.85341 0 6.34091V86.6591C0 90.1466 2.82656 93 6.28125 93H60.7187C64.1734 93 67 90.1466 67 86.6591V25.3636L41.875 0Z" fill="white"/>
        </mask>
        <g mask="url(#mask6_1_33)">
          <path d="M48.1562 25.3636C44.6859 25.3636 41.875 22.5261 41.875 19.0227V19.5511C41.875 23.0545 44.6859 25.892 48.1562 25.892H67V25.3636H48.1562Z" fill="#1A237E" fill-opacity="0.1"/>
        </g>
        <path d="M41.875 0H6.28125C2.82656 0 0 2.85341 0 6.34091V86.6591C0 90.1466 2.82656 93 6.28125 93H60.7187C64.1734 93 67 90.1466 67 86.6591V25.3636L41.875 0Z" fill="url(#paint1_radial_1_33)"/>
      </g>
      <defs>
        <linearGradient id="paint0_linear_1_33" x1="1208.22" y1="225.314" x2="1208.22" y2="2374.2" gradientUnits="userSpaceOnUse">
          <stop stop-color="#1A237E" stop-opacity="0.2"/>
          <stop offset="1" stop-color="#1A237E" stop-opacity="0.02"/>
        </linearGradient>
        <radialGradient id="paint1_radial_1_33" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(212.259 182.748) scale(10803.7 10843.3)">
          <stop stop-color="white" stop-opacity="0.1"/>
          <stop offset="1" stop-color="white" stop-opacity="0"/>
        </radialGradient>
        <clipPath id="clip0_1_33">
          <rect width="67" height="93" fill="white"/>
        </clipPath>
      </defs>
    </svg>
  `,
};
