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
  STATUS_FETCHED: 'statusfetched',
  RESOURCE_UPDATED: 'updated',
  RESOURCE_PREVIEWED: 'previewed',
  RESOURCE_DELETED: 'deleted',
  RESOURCE_PUBLISHED: 'published',
  RESOURCE_UNPUBLISHED: 'unpublished',
  EVIRONMENT_SWITCHED: 'envswitched',
  PLUGIN_USED: 'pluginused',
  SIDEKICK_READY: 'sidekick-ready',
};

/**
 * Modal types
 * @enum {string}
 */
export const MODALS = {
  ERROR: 'error',
  CONFIRM: 'confirm',
  DELETE: 'delete',
  BULK: 'bulk',
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
  BULK_PREVIEWING: 'bulk_previewing_state',
  PUBLISHNG: 'publishing_state',
  BULK_PUBLISHING: 'bulk_publishing_state',
  UNPUBLISHING: 'unpublishing_state',
  DELETING: 'deleting_state',
  TOAST: 'toast_state',
  CODE: 'code_state',
  MEDIA: 'media_state',
  READY: 'ready_state',
};

/**
 * The SVG icons.
 * @type {Object<string, import("lit").TemplateResult>}
 */
export const ICONS = {
  SIDEKICK_LOGO: html`
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="0.5" y="0.5" width="23" height="23" rx="3.5" fill="white" stroke="#D3D3D3"/>
      <path d="M18.6512 17.9971H15.7972C15.6733 17.9993 15.5515 17.9663 15.4474 17.9024C15.3432 17.8385 15.2613 17.7465 15.2122 17.6382L12.1122 10.7484C12.1033 10.7221 12.0859 10.6991 12.0625 10.6828C12.039 10.6665 12.0107 10.6577 11.9817 10.6577C11.9526 10.6577 11.9243 10.6665 11.9009 10.6828C11.8774 10.6991 11.86 10.7221 11.8512 10.7484L9.92118 15.1226C9.91056 15.1463 9.9063 15.1721 9.90877 15.1978C9.91125 15.2234 9.92039 15.2481 9.93537 15.2695C9.95035 15.2909 9.9707 15.3085 9.99459 15.3206C10.0185 15.3327 10.0451 15.3389 10.0722 15.3387H12.1942C12.2583 15.339 12.3209 15.3572 12.3742 15.391C12.4276 15.4249 12.4693 15.4729 12.4942 15.5292L13.4232 17.4954C13.4478 17.5505 13.4577 17.6107 13.4519 17.6704C13.4462 17.7301 13.425 17.7875 13.3902 17.8375C13.3554 17.8875 13.3082 17.9285 13.2527 17.9569C13.1972 17.9852 13.1352 18.0001 13.0722 18H5.35018C5.29215 17.9997 5.23509 17.9858 5.18408 17.9594C5.13307 17.933 5.0897 17.8951 5.05783 17.8489C5.02596 17.8027 5.00657 17.7498 5.0014 17.6947C4.99623 17.6397 5.00543 17.5843 5.02818 17.5334L9.94218 6.39425C9.99259 6.27648 10.0791 6.17589 10.1904 6.10558C10.3017 6.03527 10.4326 5.9985 10.5662 6.00006H13.4002C13.5338 5.99824 13.6649 6.0349 13.7762 6.10525C13.8876 6.17559 13.974 6.27633 14.0242 6.39425L18.9762 17.5211C18.9989 17.5718 19.0081 17.627 19.003 17.6819C18.9979 17.7368 18.9787 17.7896 18.9471 17.8357C18.9154 17.8819 18.8723 17.9199 18.8216 17.9464C18.7709 17.9729 18.714 17.987 18.6562 17.9876L18.6512 17.9971Z" fill="#FA0F00"/>
    </svg>`,
  HAMBURGER_ICON: html`
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16.25 14H3.75C3.33594 14 3 14.3359 3 14.75C3 15.1641 3.33594 15.5 3.75 15.5H16.25C16.6641 15.5 17 15.1641 17 14.75C17 14.3359 16.6641 14 16.25 14Z" fill="currentColor"/>
      <path d="M3.75 5.5H16.25C16.6641 5.5 17 5.16406 17 4.75C17 4.33594 16.6641 4 16.25 4H3.75C3.33594 4 3 4.33594 3 4.75C3 5.16406 3.33594 5.5 3.75 5.5Z" fill="currentColor"/>
      <path d="M16.25 9H3.75C3.33594 9 3 9.33594 3 9.75C3 10.1641 3.33594 10.5 3.75 10.5H16.25C16.6641 10.5 17 10.1641 17 9.75C17 9.33594 16.6641 9 16.25 9Z" fill="currentColor"/>
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
  SIGN_OUT: html`
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16.2 14.175V10.8277C16.2 10.455 15.8977 10.1527 15.525 10.1527C15.1524 10.1527 14.85 10.455 14.85 10.8277V14.175C14.85 14.5472 14.5473 14.85 14.175 14.85H3.82505C3.45284 14.85 3.15005 14.5472 3.15005 14.175V3.82499C3.15005 3.45277 3.45284 3.14999 3.82505 3.14999H7.25498C7.62764 3.14999 7.92998 2.84764 7.92998 2.47499C7.92998 2.10233 7.62764 1.79999 7.25498 1.79999H3.82505C2.7084 1.79999 1.80005 2.70834 1.80005 3.82499V14.175C1.80005 15.2916 2.7084 16.2 3.82505 16.2H14.175C15.2917 16.2 16.2 15.2916 16.2 14.175Z" fill="currentColor"/>
      <path d="M17.0999 1.57499V5.39341C17.0999 5.76606 16.7976 6.06841 16.4249 6.06841C16.0522 6.06841 15.7499 5.76606 15.7499 5.39341V3.20449L9.92714 9.02725C9.79531 9.15908 9.6226 9.225 9.4499 9.225C9.2772 9.225 9.10449 9.15909 8.97266 9.02725C8.70898 8.76357 8.70898 8.33642 8.97266 8.07275L14.7954 2.24999H12.6065C12.2338 2.24999 11.9315 1.94765 11.9315 1.57499C11.9315 1.20234 12.2338 0.899994 12.6065 0.899994H16.4249C16.7976 0.899994 17.0999 1.20234 17.0999 1.57499Z" fill="currentColor"/>
    </svg>
  `,
  MORE_ICON: html`
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 11.5211C10.8284 11.5211 11.5 10.8495 11.5 10.0211C11.5 9.19269 10.8284 8.52112 10 8.52112C9.17157 8.52112 8.5 9.19269 8.5 10.0211C8.5 10.8495 9.17157 11.5211 10 11.5211Z" fill="currentColor"/>
      <path d="M10 8.5C9.17157 8.5 8.5 9.17157 8.5 10C8.5 10.8284 9.17157 11.5 10 11.5C10.8284 11.5 11.5 10.8284 11.5 10C11.5 9.17157 10.8284 8.5 10 8.5Z" fill="currentColor"/>
      <path d="M4 11.5211C4.82843 11.5211 5.5 10.8495 5.5 10.0211C5.5 9.19269 4.82843 8.52112 4 8.52112C3.17157 8.52112 2.5 9.19269 2.5 10.0211C2.5 10.8495 3.17157 11.5211 4 11.5211Z" fill="currentColor"/>
      <path d="M4 11.5C4.82843 11.5 5.5 10.8284 5.5 10C5.5 9.17157 4.82843 8.5 4 8.5C3.17157 8.5 2.5 9.17157 2.5 10C2.5 10.8284 3.17157 11.5 4 11.5Z" fill="currentColor"/>
      <path d="M16 11.5211C16.8284 11.5211 17.5 10.8495 17.5 10.0211C17.5 9.19269 16.8284 8.52112 16 8.52112C15.1716 8.52112 14.5 9.19269 14.5 10.0211C14.5 10.8495 15.1716 11.5211 16 11.5211Z" fill="currentColor"/>
      <path d="M16 11.5C16.8284 11.5 17.5 10.8284 17.5 10C17.5 9.17157 16.8284 8.5 16 8.5C15.1716 8.5 14.5 9.17157 14.5 10C14.5 10.8284 15.1716 11.5 16 11.5Z" fill="currentColor"/>
    </svg>
  `,
  DOC_ICON: html`
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clip-path="url(#clip0_2001_1229)">
        <path d="M5.2207 17.9951C4.62858 17.987 4.06349 17.746 3.64783 17.3242C3.23217 16.9024 2.99943 16.3339 3 15.7417V3.24463C2.99955 2.65465 3.23099 2.08813 3.64441 1.66722C4.05783 1.24632 4.62011 1.00476 5.21 0.994629H12.5079C13.0334 0.996345 13.5369 1.20614 13.9082 1.57812L16.4297 4.13379C16.6147 4.31949 16.7611 4.54003 16.8603 4.78267C16.9596 5.02531 17.0097 5.28522 17.0078 5.54736V15.7451C17.008 16.3352 16.7764 16.9017 16.3628 17.3226C15.9493 17.7435 15.3869 17.985 14.7969 17.9951H5.2207ZM5.2207 2.49463C5.02692 2.50046 4.84309 2.5818 4.70844 2.72128C4.5738 2.86076 4.49899 3.04734 4.5 3.24121V15.7451C4.49885 15.9412 4.57496 16.1298 4.71186 16.2702C4.84875 16.4105 5.03542 16.4914 5.23145 16.4951H14.7861C14.9801 16.4895 15.1641 16.4083 15.299 16.2688C15.4338 16.1293 15.5088 15.9426 15.5078 15.7485V5.54492C15.5087 5.41195 15.4567 5.28409 15.3633 5.18945L12.8418 2.63379C12.7505 2.548 12.6311 2.49851 12.5059 2.49463H5.2207Z" fill="currentColor"/>
        <path d="M13 11.498H7C6.58594 11.498 6.25 11.1621 6.25 10.748C6.25 10.334 6.58594 9.99805 7 9.99805H13C13.4141 9.99805 13.75 10.334 13.75 10.748C13.75 11.1621 13.4141 11.498 13 11.498Z" fill="currentColor"/>
        <path d="M13 14.498H7C6.58594 14.498 6.25 14.1621 6.25 13.748C6.25 13.334 6.58594 12.998 7 12.998H13C13.4141 12.998 13.75 13.334 13.75 13.748C13.75 14.1621 13.4141 14.498 13 14.498Z" fill="currentColor"/>
      </g>
      <defs>
        <clipPath id="clip0_2001_1229">
          <rect width="18" height="18" fill="white" transform="translate(1 1)"/>
        </clipPath>
      </defs>
    </svg>
  `,
  SHEET_ICON: html`
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clip-path="url(#clip0_2001_1578)">
        <path d="M4.2207 16.9951C3.62858 16.987 3.06349 16.746 2.64783 16.3242C2.23217 15.9024 1.99943 15.3339 2 14.7417V2.24463C1.99955 1.65465 2.23099 1.08813 2.64441 0.667224C3.05783 0.24632 3.62011 0.00475904 4.21 -0.00537109H11.5079C12.0334 -0.0036551 12.5369 0.206139 12.9082 0.578119L15.4297 3.13379C15.6147 3.31949 15.7611 3.54003 15.8603 3.78267C15.9596 4.02531 16.0097 4.28522 16.0078 4.54736V14.7451C16.008 15.3352 15.7764 15.9017 15.3628 16.3226C14.9493 16.7435 14.3869 16.985 13.7969 16.9951H4.2207ZM4.2207 1.49463C4.02692 1.50046 3.84309 1.5818 3.70844 1.72128C3.5738 1.86076 3.49899 2.04734 3.5 2.24121V14.7451C3.49885 14.9412 3.57496 15.1298 3.71186 15.2702C3.84875 15.4105 4.03542 15.4914 4.23145 15.4951H13.7861C13.9801 15.4895 14.1641 15.4083 14.299 15.2688C14.4338 15.1293 14.5088 14.9426 14.5078 14.7485V4.54492C14.5087 4.41195 14.4567 4.28409 14.3633 4.18945L11.8418 1.63379C11.7505 1.548 11.6311 1.49851 11.5059 1.49463H4.2207Z" fill="#222222"/>
        <path d="M11.75 13.5H5.75C5.33594 13.5 5 13.1641 5 12.75C5 12.3359 5.33594 12 5.75 12H11.75C12.1641 12 12.5 12.3359 12.5 12.75C12.5 13.1641 12.1641 13.5 11.75 13.5Z" fill="#292929"/>
        <path d="M11.75 7.5H5.75C5.33594 7.5 5 7.16406 5 6.75C5 6.33594 5.33594 6 5.75 6H11.75C12.1641 6 12.5 6.33594 12.5 6.75C12.5 7.16406 12.1641 7.5 11.75 7.5Z" fill="#292929"/>
        <path d="M11.75 10.5H5.75C5.33594 10.5 5 10.1641 5 9.75C5 9.33594 5.33594 9 5.75 9H11.75C12.1641 9 12.5 9.33594 12.5 9.75C12.5 10.1641 12.1641 10.5 11.75 10.5Z" fill="#292929"/>
        <path d="M6.5 6.75L6.5 12.75C6.5 13.1641 6.16406 13.5 5.75 13.5C5.33594 13.5 5 13.1641 5 12.75L5 6.75C5 6.33594 5.33594 6 5.75 6C6.16406 6 6.5 6.33594 6.5 6.75Z" fill="#292929"/>
        <path d="M12.5 6.75L12.5 12.75C12.5 13.1641 12.1641 13.5 11.75 13.5C11.3359 13.5 11 13.1641 11 12.75L11 6.75C11 6.33594 11.3359 6 11.75 6C12.1641 6 12.5 6.33594 12.5 6.75Z" fill="#292929"/>
        <path d="M9.5 6.75L9.5 12.75C9.5 13.1641 9.16406 13.5 8.75 13.5C8.33594 13.5 8 13.1641 8 12.75L8 6.75C8 6.33594 8.33594 6 8.75 6C9.16406 6 9.5 6.33594 9.5 6.75Z" fill="#292929"/>
      </g>
      <defs>
        <clipPath id="clip0_2001_1578">
          <rect width="18" height="18" fill="white"/>
        </clipPath>
      </defs>
    </svg>
  `,
  PDF_ICON: html`
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clip-path="url(#clip0_632_13678)">
        <path d="M4.2207 16.9951C3.62858 16.987 3.06349 16.746 2.64783 16.3242C2.23217 15.9024 1.99943 15.3339 2 14.7417V2.24463C1.99955 1.65465 2.23099 1.08813 2.64441 0.667224C3.05783 0.24632 3.62011 0.00475904 4.21 -0.00537109H11.5079C12.0334 -0.0036551 12.5369 0.206139 12.9082 0.578119L15.4297 3.13379C15.6147 3.31949 15.7611 3.54003 15.8603 3.78267C15.9596 4.02531 16.0097 4.28522 16.0078 4.54736V14.7451C16.008 15.3352 15.7764 15.9017 15.3628 16.3226C14.9493 16.7435 14.3869 16.985 13.7969 16.9951H4.2207ZM4.2207 1.49463C4.02692 1.50046 3.84309 1.5818 3.70844 1.72128C3.5738 1.86076 3.49899 2.04734 3.5 2.24121V14.7451C3.49885 14.9412 3.57496 15.1298 3.71186 15.2702C3.84875 15.4105 4.03542 15.4914 4.23145 15.4951H13.7861C13.9801 15.4895 14.1641 15.4083 14.299 15.2688C14.4338 15.1293 14.5088 14.9426 14.5078 14.7485V4.54492C14.5087 4.41195 14.4567 4.28409 14.3633 4.18945L11.8418 1.63379C11.7505 1.548 11.6311 1.49851 11.5059 1.49463H4.2207Z" fill="#222222"/>
        <path d="M13.0084 8.61984C12.5964 8.29525 12.0729 8.14651 11.5517 8.206C11.1574 8.21042 10.7639 8.24455 10.3746 8.30812C10.1248 8.06637 9.89804 7.80184 9.69734 7.51798C9.54154 7.30709 9.3997 7.08624 9.27271 6.85685C9.4911 6.24454 9.61789 5.60335 9.64897 4.954C9.64897 4.37349 9.41784 3.75 8.77283 3.75C8.66298 3.75299 8.55566 3.78361 8.46078 3.83904C8.3659 3.89447 8.28652 3.97291 8.22997 4.06713C8.10755 4.47118 8.06871 4.89594 8.11584 5.31549C8.16296 5.73504 8.29506 6.1406 8.50407 6.50742C8.34819 6.96431 8.18156 7.40507 7.97731 7.89957C7.80202 8.31999 7.60466 8.73086 7.38605 9.13047C6.72491 9.39385 5.32205 10.0389 5.18763 10.7537C5.16724 10.8573 5.17438 10.9645 5.20834 11.0645C5.24229 11.1644 5.30188 11.2538 5.38114 11.3235C5.53796 11.4619 5.74185 11.535 5.9509 11.5278C6.79479 11.5278 7.63868 10.356 8.20844 9.35085C8.53094 9.24335 8.85882 9.14122 9.18671 9.05522C9.54684 8.95847 9.89084 8.88322 10.2187 8.82409C10.7824 9.36905 11.5263 9.68842 12.3096 9.72173C12.8579 9.72173 13.0621 9.48523 13.1374 9.28635C13.177 9.17381 13.186 9.05274 13.1633 8.93559C13.1407 8.81845 13.0872 8.70945 13.0084 8.61984ZM12.4225 9.02835C12.3958 9.11261 12.3401 9.1847 12.2654 9.23191C12.1906 9.27912 12.1016 9.2984 12.014 9.28635C11.9524 9.28748 11.8909 9.28025 11.8312 9.26485C11.402 9.15602 11.002 8.95417 10.6595 8.67359C10.9477 8.63034 11.2388 8.60878 11.5302 8.60909C11.7247 8.60468 11.9191 8.61908 12.1108 8.65209C12.2774 8.679 12.4709 8.77572 12.4225 9.02835ZM8.57397 4.27138C8.59167 4.23647 8.61853 4.20704 8.65166 4.18621C8.6848 4.16538 8.72297 4.15395 8.7621 4.15313C8.96636 4.15313 9.00936 4.40039 9.00936 4.60464C8.98164 5.09257 8.8913 5.5749 8.74057 6.03979C8.47001 5.49071 8.41071 4.86133 8.57397 4.27138ZM9.06311 8.58759C8.88573 8.63596 8.70835 8.68434 8.53097 8.73809C8.62773 8.54459 8.71373 8.35646 8.78897 8.17371C8.88572 7.93183 8.98247 7.69532 9.06847 7.45882C9.14373 7.57707 9.21898 7.68995 9.2996 7.80282C9.45253 8.0164 9.61764 8.22099 9.79411 8.41558C9.79409 8.41021 9.305 8.52309 9.06311 8.58759ZM7.17645 9.66259C6.63356 10.5333 6.10145 11.0816 5.78967 11.0816C5.73891 11.082 5.68956 11.0649 5.64992 11.0332C5.62094 11.0098 5.59905 10.9788 5.58671 10.9437C5.57437 10.9086 5.57206 10.8707 5.58005 10.8343C5.64452 10.5226 6.25731 10.0711 7.17645 9.66259Z" fill="#222222"/>
      </g>
      <defs>
        <clipPath id="clip0_632_13678">
          <rect width="18" height="18" fill="white"/>
        </clipPath>
      </defs>
    </svg>
  `,
  PLUS_ICON: html`
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14.625 8.32501H9.67495V3.37501C9.67495 3.00236 9.37261 2.70001 8.99995 2.70001C8.6273 2.70001 8.32495 3.00236 8.32495 3.37501V8.32501H3.37495C3.0023 8.32501 2.69995 8.62736 2.69995 9.00001C2.69995 9.37267 3.0023 9.67501 3.37495 9.67501H8.32495V14.625C8.32495 14.9977 8.6273 15.3 8.99995 15.3C9.37261 15.3 9.67495 14.9977 9.67495 14.625V9.67501H14.625C14.9976 9.67501 15.3 9.37267 15.3 9.00001C15.3 8.62736 14.9976 8.32501 14.625 8.32501Z" fill="currentColor"/>
    </svg>
  `,
  OPTIONS_ICON: html`
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1.5749 6.09432H3.97673C4.28331 7.38149 5.43588 8.34432 6.81538 8.34432C8.19487 8.34432 9.34746 7.38149 9.65402 6.09432H16.4249C16.7975 6.09432 17.0999 5.79198 17.0999 5.41932C17.0999 5.04667 16.7975 4.74432 16.4249 4.74432H9.65402C9.34745 3.45716 8.19487 2.49432 6.81538 2.49432C5.43588 2.49432 4.2833 3.45716 3.97673 4.74432H1.5749C1.20225 4.74432 0.899902 5.04667 0.899902 5.41932C0.899902 5.79198 1.20225 6.09432 1.5749 6.09432ZM6.81538 3.84432C7.68373 3.84432 8.39038 4.55097 8.39038 5.41932C8.39038 6.28768 7.68373 6.99432 6.81538 6.99432C5.94702 6.99432 5.24038 6.28768 5.24038 5.41932C5.24038 4.55097 5.94702 3.84432 6.81538 3.84432Z" fill="currentColor"/>
      <path d="M16.4249 11.9443H14.154C13.8475 10.6572 12.6949 9.69434 11.3154 9.69434C9.93589 9.69434 8.78331 10.6572 8.47674 11.9443H1.5749C1.20225 11.9443 0.899902 12.2467 0.899902 12.6193C0.899902 12.992 1.20225 13.2943 1.5749 13.2943H8.47673C8.78331 14.5815 9.93588 15.5443 11.3154 15.5443C12.6949 15.5443 13.8475 14.5815 14.154 13.2943H16.4249C16.7975 13.2943 17.0999 12.992 17.0999 12.6193C17.0999 12.2467 16.7976 11.9443 16.4249 11.9443ZM11.3154 14.1943C10.447 14.1943 9.74038 13.4877 9.74038 12.6193C9.74038 11.751 10.447 11.0443 11.3154 11.0443C12.1837 11.0443 12.8904 11.751 12.8904 12.6193C12.8904 13.4877 12.1837 14.1943 11.3154 14.1943Z" fill="currentColor"/>
    </svg>
  `,
  HELP_ICON: html`
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8.98931 13.9741C8.78173 13.9814 8.57947 13.9076 8.42537 13.7684C8.12807 13.4398 8.12807 12.9394 8.42537 12.6109C8.57778 12.4682 8.78071 12.3921 8.98934 12.3994C9.20206 12.3908 9.40864 12.4717 9.55906 12.6223C9.70492 12.7734 9.7833 12.9772 9.77629 13.1871C9.78743 13.3986 9.71366 13.6058 9.57136 13.7626C9.41514 13.9109 9.20428 13.9875 8.98931 13.9741Z" fill="currentColor"/>
      <path d="M9 16.875C4.65732 16.875 1.125 13.3427 1.125 9C1.125 4.65732 4.65732 1.125 9 1.125C13.3427 1.125 16.875 4.65732 16.875 9C16.875 13.3427 13.3427 16.875 9 16.875ZM9 2.475C5.40175 2.475 2.475 5.40175 2.475 9C2.475 12.5982 5.40175 15.525 9 15.525C12.5982 15.525 15.525 12.5982 15.525 9C15.525 5.40175 12.5982 2.475 9 2.475Z" fill="currentColor"/>
      <path d="M8.99286 11.4354C8.62021 11.4354 8.31786 11.1331 8.31786 10.7604C8.31786 9.84021 8.38114 9.21794 9.25302 8.34607C9.95966 7.63855 10.0792 7.35467 10.0792 6.85984C10.0792 6.67087 10.0194 5.72781 8.84257 5.72781C7.61386 5.72781 7.48291 6.76843 7.46884 6.97674C7.44511 7.34852 7.11552 7.62537 6.75165 7.60604C6.37899 7.58143 6.09774 7.26062 6.12235 6.88884C6.17948 6.02049 6.82108 4.37781 8.84256 4.37781C10.5406 4.37781 11.4292 5.62674 11.4292 6.85984C11.4292 7.88903 11.0179 8.48933 10.2075 9.30056C9.68895 9.81911 9.66785 10.0309 9.66785 10.7604C9.66785 11.1331 9.36552 11.4354 8.99286 11.4354Z" fill="currentColor"/>
    </svg>
  `,
  TRASH_ICON: html`
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7.42419 13.5193C7.06384 13.5193 6.76413 13.2337 6.75094 12.8707L6.52594 7.02071C6.511 6.64805 6.80192 6.33428 7.1737 6.32022C7.18336 6.31934 7.19216 6.31934 7.20094 6.31934C7.56129 6.31934 7.861 6.60498 7.87419 6.96797L8.09919 12.818C8.11413 13.1906 7.82321 13.5044 7.45143 13.5185C7.44176 13.5193 7.43297 13.5193 7.42419 13.5193Z" fill="#D73220"/>
      <path d="M10.5759 13.5193C10.5671 13.5193 10.5584 13.5193 10.5487 13.5185C10.1769 13.5044 9.886 13.1906 9.90094 12.818L10.1259 6.96797C10.1391 6.60498 10.4388 6.31934 10.7992 6.31934C10.808 6.31934 10.8168 6.31934 10.8264 6.32022C11.1982 6.33428 11.4891 6.64805 11.4742 7.02071L11.2492 12.8707C11.236 13.2337 10.9363 13.5193 10.5759 13.5193Z" fill="#D73220"/>
      <path d="M15.2999 3.59999H12.1499V2.92499C12.1499 1.80879 11.2411 0.899994 10.1249 0.899994H7.8749C6.7587 0.899994 5.8499 1.80879 5.8499 2.92499V3.59999H2.6999C2.32725 3.59999 2.0249 3.90234 2.0249 4.27499C2.0249 4.64765 2.32725 4.94999 2.6999 4.94999H3.16792L3.54804 14.2576C3.59111 15.3466 4.48056 16.2 5.57129 16.2H12.4285C13.5192 16.2 14.4087 15.3466 14.4518 14.2576L14.8319 4.94999H15.2999C15.6726 4.94999 15.9749 4.64765 15.9749 4.27499C15.9749 3.90234 15.6726 3.59999 15.2999 3.59999ZM7.1999 2.92499C7.1999 2.55321 7.50312 2.24999 7.8749 2.24999H10.1249C10.4967 2.24999 10.7999 2.55321 10.7999 2.92499V3.59999H7.1999V2.92499ZM13.1035 14.2031C13.0886 14.5661 12.7924 14.85 12.4285 14.85H5.57129C5.20742 14.85 4.91123 14.5661 4.89629 14.2031L4.51858 4.94999H13.4812L13.1035 14.2031Z" fill="#D73220"/>
    </svg>
  `,
  CODE_ICON: html`<i class="code">&lt;/&gt;</i>`,
  MEDIA_ICON: html`
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M11.6642 4.92114C11.6642 5.61702 11.0856 6.18114 10.3719 6.18114C9.65825 6.18114 9.07971 5.61702 9.07971 4.92114C9.07971 4.22526 9.65826 3.66114 10.3719 3.66114C11.0856 3.66114 11.6642 4.22526 11.6642 4.92114Z" fill="currentColor"/>
      <path d="M16.75 19H10.25C9.00977 19 8 17.9902 8 16.75V10.25C8 9.00977 9.00977 8 10.25 8H16.75C17.9902 8 19 9.00977 19 10.25V16.75C19 17.9902 17.9902 19 16.75 19ZM10.25 9.5C9.83691 9.5 9.5 9.83691 9.5 10.25V16.75C9.5 17.1631 9.83691 17.5 10.25 17.5H16.75C17.1631 17.5 17.5 17.1631 17.5 16.75V10.25C17.5 9.83691 17.1631 9.5 16.75 9.5H10.25Z" fill="currentColor"/>
      <path d="M12 15.1316V12.2249C12 11.7962 12.414 11.5348 12.7332 11.762L15.0838 13.2154C15.3841 13.4292 15.3841 13.9273 15.0838 14.141L12.7332 15.5944C12.414 15.8216 12 15.5602 12 15.1316Z" fill="currentColor"/>
      <path d="M13.0225 1H2.97754C1.88672 1 1 1.90137 1 3.00977V10.9902C1 12.0986 1.88672 13 2.97754 13H5.75C6.16406 13 6.5 12.6641 6.5 12.25C6.5 11.8359 6.16406 11.5 5.75 11.5H2.97754C2.71387 11.5 2.5 11.2715 2.5 10.9902V10.2173L5.09473 7.68653C5.25977 7.5254 5.54004 7.52344 5.69922 7.67872L6.17676 8.15626C6.46973 8.44923 6.94434 8.44923 7.23731 8.15626C7.53028 7.86329 7.53028 7.38868 7.23731 7.09571L6.75293 6.61133C6.01074 5.88574 4.79688 5.88477 4.04883 6.61133L2.5 8.12207V3.00977C2.5 2.72852 2.71387 2.5 2.97754 2.5H13.0225C13.2861 2.5 13.5 2.72852 13.5 3.00977V5.7002C13.5 6.11426 13.8359 6.4502 14.25 6.4502C14.6641 6.4502 15 6.11426 15 5.7002V3.00977C15 1.90137 14.1133 1 13.0225 1Z" fill="currentColor"/>
    </svg>
  `,
  PRESENT_ICON: html`
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14.175 5.39997H12.9925C13.1669 5.06116 13.275 4.68267 13.275 4.27585C13.275 2.91091 12.165 1.80085 10.8 1.80085C10.089 1.80085 9.4518 2.10628 9.00005 2.58791C8.54829 2.10627 7.91108 1.80085 7.20005 1.80085C5.83511 1.80085 4.72505 2.91091 4.72505 4.27585C4.72505 4.68268 4.83316 5.06116 5.00761 5.39997H3.82505C2.70884 5.39997 1.80005 6.30877 1.80005 7.42497V8.77497C1.80005 9.47513 2.15799 10.0931 2.70005 10.457V14.175C2.70005 15.2912 3.60884 16.2 4.72505 16.2H13.275C14.3913 16.2 15.3 15.2912 15.3 14.175V10.457C15.8421 10.0931 16.2 9.47514 16.2 8.77497V7.42497C16.2 6.30877 15.2913 5.39997 14.175 5.39997ZM14.85 7.42497V8.77497C14.85 9.14675 14.5468 9.44997 14.175 9.44997H9.67505V6.75085H10.8C10.8031 6.75085 10.8058 6.74997 10.8088 6.74997H14.175C14.5468 6.74997 14.85 7.05319 14.85 7.42497ZM10.8 3.15085C11.4206 3.15085 11.925 3.65535 11.925 4.27585C11.925 4.89482 11.4227 5.39745 10.8044 5.39997H9.67505V4.27585C9.67505 3.65535 10.1795 3.15085 10.8 3.15085ZM6.07505 4.27585C6.07505 3.65535 6.57954 3.15085 7.20005 3.15085C7.82055 3.15085 8.32505 3.65535 8.32505 4.27585V5.39997H7.19566C6.57735 5.39744 6.07505 4.89482 6.07505 4.27585ZM3.15005 7.42497C3.15005 7.05319 3.45327 6.74997 3.82505 6.74997H7.19126C7.19433 6.74997 7.19697 6.75085 7.20005 6.75085H8.32505V9.44997H3.82505C3.45327 9.44997 3.15005 9.14675 3.15005 8.77497V7.42497ZM4.05005 14.175V10.8H8.32505V14.85H4.72505C4.35327 14.85 4.05005 14.5468 4.05005 14.175ZM13.275 14.85H9.67505V10.8H13.95V14.175C13.95 14.5468 13.6468 14.85 13.275 14.85Z" fill="currentColor"/>
    </svg>
  `,
};
