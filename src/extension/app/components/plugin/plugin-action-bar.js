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

/* eslint-disable max-len */

import { html } from 'lit';
import {
  customElement, queryAll, queryAsync, state,
} from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { reaction } from 'mobx';
import {
  EVENTS, ICONS, STATE,
} from '../../constants.js';
import { style } from './plugin-action-bar.css.js';
import { ConnectedElement } from '../connected-element/connected-element.js';
import { EventBus } from '../../utils/event-bus.js';
import '../action-bar/activity-action/activity-action.js';
import '../bulk/bulk-info/bulk-info.js';
import { getConfig } from '../../../config.js';

/**
 * @typedef {import('../plugin/plugin.js').Plugin} Plugin
 */

/**
 * The lit template result type
 * @typedef {import('lit').TemplateResult} TemplateResult
 */

/**
 * The maximum width of the action bar when window is wider than 800px
 * @type {number}
 */
const ACTION_BAR_MAX_WIDTH = 800;

/**
 * The gap between plugins in the plugin group (from CSS)
 * @type {number}
 */
const PLUGIN_GAP = 8;

@customElement('plugin-action-bar')
export class PluginActionBar extends ConnectedElement {
  static get styles() {
    return [
      style,
    ];
  }

  /**
   * All core and custom plugins visible in this environment.
   * @type {Plugin[]}
   */
  visiblePlugins = [];

  /**
   * All pinned plugins (to be distributed to the action bar/menu)
   * @type {Plugin[]}
   */
  pinnedPlugins = [];

  /**
   * The plugins folded into the action menu.
   * @type {Plugin[]}
   */
  menuPlugins = [];

  /**
   * The badge plugins.
   * @type {Plugin[]}
   */
  badgePlugins = [];

  /**
   * The current width of the action bar.
   * @type {number}
   */
  actionBarWidth = 0;

  /**
   * The last window width we calculated for
   * @type {number}
   */
  lastWindowWidth = 0;

  /**
   * Last plugin count (to detect plugin visibility changes)
   * @type {number}
   */
  lastPluginCount = 0;

  /**
   * Whether plugin distribution is currently running
   * @type {boolean}
   */
  isDistributing = false;

  /**
   * Timeout ID for post-resize plugin distribution check
   * @type {number|null}
   */
  resizeDistributingTimeout = null;

  /**
   * The configured projects
   * @type {Array}
   */
  projects = [];

  /**
   * Whether the action bar is currently being dragged
   * @type {boolean}
   */
  isDragging = false;

  /**
   * The initial X coordinate when drag starts
   * @type {number}
   */
  dragStartX = 0;

  /**
   * The initial Y coordinate when drag starts
   * @type {number}
   */
  dragStartY = 0;

  /**
   * The initial left position (translateX) when drag starts
   * @type {number}
   */
  initialLeft = 0;

  /**
   * The initial bottom position when drag starts
   * @type {number}
   */
  initialBottom = 0;

  /**
   * Throttle timer for window resize handler
   * @type {number|null}
   */
  resizeThrottle = null;

  /**
   * The plugins visible in the action bar.
   * @type {Plugin[]}
   */
  @state()
  accessor barPlugins = [];

  /**
   * The plugins temporarily folded into the action menu.
   * @type {Plugin[]}
   */
  @state()
  accessor transientPlugins = [];

  @queryAsync('action-bar')
  accessor actionBar;

  @queryAsync('.logo')
  accessor logoContainer;

  @queryAll('div.action-group')
  accessor actionGroups;

  @queryAsync('sp-action-menu#plugin-menu')
  accessor pluginMenu;

  @queryAsync('sp-action-menu#sidekick-menu')
  accessor sidekickMenu;

  @queryAsync('.close-button')
  accessor closeButton;

  @queryAsync('.drag-handle')
  accessor dragHandle;

  async connectedCallback() {
    super.connectedCallback();

    // Get configured projects
    this.projects = await getConfig('sync', 'projects') || [];

    reaction(
      () => this.appStore.state,
      async () => {
        this.setupPlugins();

        const actionBar = await this.actionBar;
        if (actionBar) {
          if (this.appStore.state === STATE.TOAST) {
            actionBar.classList.add(this.appStore.toast.variant);

            // We need to reset the class name to remove the toast variant, but only if it exists.
            // It's possible for actionBar to be null on the first render.
          } else if (actionBar) {
            actionBar.className = '';
          }
        }
      },
    );

    reaction(
      () => this.appStore.theme,
      async () => {
        this.setupPlugins();
      },
    );

    reaction(
      () => this.appStore.bulkStore.selection,
      () => {
        this.setupPlugins();
      },
    );

    // trap clicks inside action bar
    this.addEventListener('click', this.onClick);

    // Listen for close popover events
    EventBus.instance.addEventListener(EVENTS.CLOSE_POPOVER, (e) => {
      const { id } = e.detail || {};
      if (!id) {
        return;
      }

      // Find the plugin and delegate to it
      const plugin = this.visiblePlugins.find((p) => p.getId() === id);
      if (plugin) {
        plugin.closePopover();
      }
    });

    window.addEventListener('resize', this.onWindowResize);

    this.requestUpdate();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('click', this.onClick);
    window.removeEventListener('resize', this.onWindowResize);
    EventBus.instance.removeEventListener(EVENTS.CLOSE_POPOVER);

    // Clear any pending throttled resize
    if (this.resizeThrottle) {
      window.clearTimeout(this.resizeThrottle);
      this.resizeThrottle = null;
    }

    // Clear any pending post-resize check
    if (this.resizeDistributingTimeout) {
      window.clearTimeout(this.resizeDistributingTimeout);
      this.resizeDistributingTimeout = null;
    }
  }

  /**
   * Set up the bar and menu plugins in this environment and updates the component.
   */
  setupPlugins() {
    this.visiblePlugins = [
      ...Object.values(this.appStore.corePlugins),
      ...Object.values(this.appStore.customPlugins),
    ].filter((plugin) => plugin.isVisible());

    // Store all pinned plugins (before distribution)
    this.pinnedPlugins = this.visiblePlugins
      .filter((plugin) => plugin.isPinned() && !plugin.isBadge());

    // Non-pinned plugins go directly to menu (not subject to distribution)
    this.menuPlugins = this.visiblePlugins
      .filter((plugin) => !plugin.isPinned() && !plugin.isBadge());

    this.badgePlugins = this.visiblePlugins
      .filter((plugin) => plugin.isBadge());

    this.requestUpdate();
  }

  /**
   * Handle window resize
   */
  onWindowResize = () => {
    // Throttle resize handling to avoid performance issues
    if (this.resizeThrottle) {
      return;
    }

    this.resizeThrottle = window.setTimeout(() => {
      if (this.hasAttribute('style')) {
        if (window.innerWidth <= ACTION_BAR_MAX_WIDTH) {
          // Below 800px, remove custom positioning
          this.removeAttribute('style');
        } else {
          // Restrict custom positioning to viewport
          this.constrainToViewport();
        }
      }
      this.resizeThrottle = null;
    }, 150);

    // Trigger plugin redistribution with resize flag
    this.distributePlugins(true);
  };

  /**
   * Prevent selection during drag
   * @param {Event} e The event
   */
  preventSelection = (e) => {
    if (this.isDragging) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  /**
   * Handle mouse leaving viewport during drag
   */
  onMouseLeave = () => {
    if (this.isDragging) {
      this.onDragEnd();
    }
  };

  /**
   * Handle drag move
   * @param {MouseEvent} e The mouse event
   */
  onDragMove = (e) => {
    if (!this.isDragging) return;

    e.preventDefault();

    // Calculate delta
    const deltaX = e.clientX - this.dragStartX;
    const deltaY = this.dragStartY - e.clientY; // Inverted because bottom increases upward

    // Calculate new position
    const newLeft = this.initialLeft + deltaX;
    const newBottom = this.initialBottom + deltaY;

    // Apply new position
    this.style.left = '50%';
    this.style.transform = `translate(${newLeft}px, 0px)`;
    this.style.bottom = `${newBottom}px`;
  };

  /**
   * Handle drag end
   */
  onDragEnd = (e) => {
    if (!this.isDragging) return;

    if (e) {
      e.preventDefault();
    }

    this.isDragging = false;

    // Reset drag start positions
    this.dragStartX = 0;
    this.dragStartY = 0;

    // Remove event listeners
    window.removeEventListener('mousemove', this.onDragMove, false);
    window.removeEventListener('mouseup', this.onDragEnd, false);
    window.removeEventListener('selectstart', this.preventSelection, true);
    window.removeEventListener('mouseleave', this.onMouseLeave, false);

    // Remove dragging attribute
    this.removeAttribute('dragging');

    // Constrain to viewport
    this.constrainToViewport();
  };

  /**
   * Handle drag start
   * @param {MouseEvent} e The mouse event
   */
  onDragStart = (e) => {
    e.preventDefault();
    e.stopPropagation();

    this.isDragging = true;

    this.appStore.sampleRUM('click', { source: 'sidekick', target: 'sidekick-dragged' });

    // Store initial mouse position
    this.dragStartX = e.clientX;
    this.dragStartY = e.clientY;

    // Get current position
    const computedStyle = window.getComputedStyle(this);
    const { transform, bottom } = computedStyle;

    // Parse current position from transform and bottom
    if (transform && transform !== 'none') {
      const matrix = new DOMMatrixReadOnly(transform);
      this.initialLeft = matrix.m41; // translateX value
    } else {
      this.initialLeft = 0;
    }

    this.initialBottom = parseInt(bottom, 10) || 0;

    // Add move and up listeners
    window.addEventListener('mousemove', this.onDragMove, false);
    window.addEventListener('mouseup', this.onDragEnd, false);
    window.addEventListener('selectstart', this.preventSelection, true);
    window.addEventListener('mouseleave', this.onMouseLeave, false);

    // Set dragging attribute for CSS styling
    this.setAttribute('dragging', 'true');
  };

  /**
   * Constrain the element to viewport bounds
   */
  constrainToViewport() {
    const rect = this.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Get current values
    const computedStyle = window.getComputedStyle(this);
    const { transform, bottom } = computedStyle;

    let translateX = 0;
    if (transform && transform !== 'none') {
      const matrix = new DOMMatrixReadOnly(transform);
      translateX = matrix.m41;
    }

    const currentBottom = parseInt(this.style.bottom || bottom, 10) || 0;

    // Check horizontal bounds
    let newTranslateX = translateX;
    let newLeft = '50%'; // Default for too far left
    if (rect.left < 0) {
      // Too far left
      newTranslateX = translateX - rect.left;
    } else if (rect.right > viewportWidth) {
      // Too far right
      newTranslateX = translateX - (rect.right - viewportWidth);
      newLeft = '49%'; // Account for scrollbar
    }

    // Check vertical bounds
    let newBottom = currentBottom;
    if (rect.top < 0) {
      // Too far up - decrease bottom to move element down
      newBottom = Math.max(0, currentBottom + rect.top);
    } else if (rect.bottom > viewportHeight) {
      // Too far down - increase bottom to move element up
      newBottom = currentBottom + (rect.bottom - viewportHeight);
    }

    // Apply constrained position
    this.style.left = newLeft;
    this.style.transform = `translate(${newTranslateX}px, 0px)`;
    this.style.bottom = `${newBottom}px`;
  }

  /**
   * Utility function to calculate the total width of an element including padding.
   * @param {HTMLElement} element - The DOM element.
   * @returns {number} - The total width in pixels.
   */
  getTotalWidth = (element) => {
    const styles = window.getComputedStyle(element);
    const width = parseInt(styles.width, 10) || 0;
    const padding = parseInt(styles.padding, 10) || 0;
    return width + padding * 2;
  };

  /**
   * Distribute plugins between bar and menu based on available space.
   * @param {boolean} resizing - Whether this is called during a resize event
   * @param {boolean} checkAfterResize - Whether this is a post-resize verification check
   */
  async distributePlugins(resizing = false, checkAfterResize = false) {
    // Prevent parallel execution
    if (this.isDistributing) {
      return;
    }

    // Wait for DOM elements to be ready
    if (this.actionGroups.length < 3) {
      return;
    }

    // Only recalculate if window width or plugin count changed
    const currentWindowWidth = window.innerWidth;
    const currentPluginCount = this.pinnedPlugins.length;
    if (currentWindowWidth === this.lastWindowWidth
      && currentPluginCount === this.lastPluginCount) {
      return;
    }

    this.isDistributing = true;

    try {
      // Schedule a post-resize check if we're resizing but not already in a check
      if (resizing && !checkAfterResize) {
        // Clear any pending post-resize check
        if (this.resizeDistributingTimeout) {
          window.clearTimeout(this.resizeDistributingTimeout);
        }
        // Schedule a new check after UI has settled
        this.resizeDistributingTimeout = window.setTimeout(() => {
          this.resizeDistributingTimeout = null;
          this.distributePlugins(true, true);
        }, 150);
      }

      this.lastWindowWidth = currentWindowWidth;
      this.lastPluginCount = currentPluginCount;

      // Determine maximum bar width based on window size
      const maxBarWidth = currentWindowWidth > ACTION_BAR_MAX_WIDTH
        ? ACTION_BAR_MAX_WIDTH
        : currentWindowWidth;

      // Get fixed width elements
      const [logoContainer, closeButton] = await Promise.all([
        this.logoContainer,
        this.closeButton,
      ]);

      const logoWidth = this.getTotalWidth(logoContainer);
      const closeButtonWidth = parseInt(window.getComputedStyle(closeButton).width, 10);

      // Get system plugins width and plugin menu button width
      const [pluginGroup, pluginMenu, systemGroup] = this.actionGroups;
      const pluginGroupPadding = parseInt(window.getComputedStyle(pluginGroup).padding, 10) * 2;
      const pluginMenuWidth = this.getTotalWidth(pluginMenu);
      const systemWidth = this.getTotalWidth(systemGroup);

      // Calculate fixed widths
      const fixedWidth = logoWidth + pluginGroupPadding + 3 + systemWidth + pluginMenuWidth + closeButtonWidth;

      // Calculate available space for plugins
      const availableWidth = maxBarWidth - fixedWidth;

      // Distribute plugins
      const fittingPlugins = [];
      const overflowPlugins = [];
      let accumulatedWidth = 0;
      let hasOverflowed = false; // Track if we've started overflowing

      // Iterate through plugins in original order to preserve sequence
      for (const plugin of this.pinnedPlugins) {
        const pluginWidth = plugin.getEstimatedWidth();
        const gapWidth = fittingPlugins.length > 0 ? PLUGIN_GAP : 0;
        const requiredWidth = accumulatedWidth + pluginWidth + gapWidth;

        // Always keep env-switcher in the bar, regardless of space
        const isEnvSwitcher = plugin.id === 'env-switcher';
        const fitsInBar = requiredWidth <= availableWidth;

        // Add to bar if: it's env-switcher OR (it fits AND nothing has overflowed yet)
        if (isEnvSwitcher || (fitsInBar && !hasOverflowed)) {
          fittingPlugins.push(plugin);
          accumulatedWidth = requiredWidth;
        } else {
          // Plugin overflows - add to menu and mark that we've started overflowing
          overflowPlugins.push(plugin);
          hasOverflowed = true;
        }
      }

      // Update reactive arrays with new distribution
      this.barPlugins = [...fittingPlugins];
      this.transientPlugins = [...overflowPlugins];
    } finally {
      this.isDistributing = false;
    }
  }

  async updated() {
    await this.updateComplete;
    await this.distributePlugins();
  }

  // istanbul ignore next 7
  async onPluginMenuSelect() {
    // @ts-ignore
    const pluginMenu = await this.pluginMenu;
    if (pluginMenu) {
      pluginMenu.value = '';
    }
  }

  onClick(e) {
    e.stopPropagation();
  }

  /**
   * Handles the keydown event on the close button.
   * @param {KeyboardEvent} e The keyboard event.
   */
  // istanbul ignore next 5
  onCloseButtonKeyDown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      this.onCloseButtonClick();
    }
  }

  /**
   * Handles the click event on the close button.
   */
  onCloseButtonClick() {
    this.appStore.fireEvent('hidden');
  }

  /**
   * Renders the logo. Hidden when the state is TOAST.
   * @returns {TemplateResult} The Lit-html template for the logo.
   */
  renderLogo() {
    if (this.appStore.state === STATE.TOAST) {
      return html``;
    }

    return html`
      <div class="logo">
        <div class="drag-handle" title="${this.appStore.i18n('drag_to_reposition')}" @mousedown="${this.onDragStart}">
          <div class="drag-bar"></div>
        </div>
        ${ICONS.SIDEKICK_LOGO}
      </div>
      <sp-menu-divider size="s" vertical></sp-menu-divider>
    `;
  }

  /**
   * Renders the close button. Hidden when the state is TOAST.
   * @returns {TemplateResult} The Lit-html template for the close button.
   */
  renderCloseButton() {
    if (this.appStore.state === STATE.TOAST) {
      return html``;
    }

    return html`
      <div class="close-button" @click=${this.onCloseButtonClick} @keydown=${this.onCloseButtonKeyDown} title="${this.appStore.i18n('close_sidekick')}">
        <sp-menu-divider size="s" vertical></sp-menu-divider>
        <sp-icon size="m">${ICONS.CLOSE_SIDEKICK}</sp-icon>
      </div>
    `;
  }

  renderPluginMenuItem(plugin) {
    return plugin.isContainer()
      ? html`<sp-menu-group id="plugin-group-${plugin.id}" selects="single">
          <span slot="header">${plugin.getButtonText()}</span>
          ${Object.values(plugin.children).map((p) => p.renderMenuItem())}
        </sp-menu-group>`
      : html`${plugin.renderMenuItem()}`;
  }

  /**
   * Render the plugin menu with unpinned and transient plugins
   * @returns {TemplateResult|string} An array of Lit-html templates or strings, or a single empty string.
   */
  renderPluginMenu() {
    if (this.appStore.state === STATE.TOAST) {
      return html``;
    }

    if (this.appStore.state !== STATE.READY) {
      return html`<div class="action-group"></div>`;
    }

    const isHidden = this.menuPlugins.length === 0 && this.transientPlugins.length === 0;

    return html`
      <div class=${`action-group plugin-menu-container ${isHidden ? 'hidden' : ''}`}>
        ${this.transientPlugins.length > 0 || this.menuPlugins.length > 0 ? html`
          <sp-action-menu
            id="plugin-menu"
            chevron="false"
            placement="top"
            label=""
            title="${this.appStore.i18n('plugins_more')}"
            quiet
            tabindex="0"
            @change=${this.onPluginMenuSelect}
            .disabled=${this.appStore.state !== STATE.READY}>
            <sp-icon slot="icon" size="m">
              ${ICONS.MORE_ICON}
            </sp-icon>
            ${this.transientPlugins.map((p) => this.renderPluginMenuItem(p))}
            ${this.menuPlugins.length > 0 && this.transientPlugins.length > 0
              ? html`<sp-menu-divider size="s"></sp-menu-divider>`
              : ''}
            ${this.menuPlugins.map((p) => this.renderPluginMenuItem(p))}
          </sp-action-menu>
        ` : ''}
      </div>
      `;
  }

  /**
   * Render the pinned core and custom plugins
   * @returns {(TemplateResult|string)|string} An array of Lit-html templates or strings, or a single empty string.
   */
  renderPlugins() {
    if (this.appStore.state !== STATE.READY) {
      return html`
        <div class="action-group activity-container">
          <activity-action></activity-action>
        </div>`;
    }

    return html`
      <div class="action-group plugins-container">
        ${this.appStore.isAdmin()
          ? html`<bulk-info></bulk-info><sp-menu-divider size="s" vertical></sp-menu-divider>`
          : ''}
        ${this.barPlugins.length > 0 ? this.barPlugins.map((p) => p.render()) : ''}
      </div>`;
  }

  /**
   * Renders the badge plugins.
   *
   * @returns {TemplateResult} The HTML template for the badge plugin.
   */
  renderBadgePlugins() {
    if (this.appStore.state !== STATE.READY || this.badgePlugins.length === 0) {
      return html``;
    }

    return html`
      <div class="badge-plugins-container">
        ${this.badgePlugins.map((p) => p.render())}
      </div>`;
  }

  async handleItemSelection(event) {
    const { value } = event.target;
    const menu = await this.sidekickMenu;
    menu.removeAttribute('open');

    if (value === 'help-opened') {
      this.appStore.sampleRUM('click', { source: 'sidekick', target: 'help-opened' });
      this.appStore.openPage('https://www.aem.live/docs/sidekick');
    } else if (value === 'whats-new-opened') {
      this.appStore.sampleRUM('click', { source: 'sidekick', target: 'whats-new-opened' });
      this.appStore.showOnboarding();
    } else if (value === 'project-added' || value === 'project-removed') {
      this.appStore.sampleRUM('click', { source: 'sidekick', target: value });
      chrome.runtime.sendMessage({ action: 'addRemoveProject' });
    } else if (value === 'project-admin-opened') {
      this.appStore.sampleRUM('click', { source: 'sidekick', target: 'project-admin-opened' });
      chrome.runtime.sendMessage({ action: 'manageProjects' });
    }
  }

  toggleTheme(e) {
    e.stopPropagation();
    this.appStore.toggleTheme();
  }

  renderSystemPlugins() {
    const { siteStore } = this.appStore;

    const systemPlugins = [];

    if (this.appStore.state === STATE.TOAST) {
      return html``;
    }

    const properties = html`
      <sp-action-menu id="sidekick-menu" placement="top" quiet tabindex="0">
        <sp-icon slot="icon" size="l">
          ${ICONS.HAMBURGER_ICON}
        </sp-icon>
        ${siteStore.transient
        ? html`
            <sk-menu-item class="icon-item" value="project-added" @click=${this.handleItemSelection}>
              <sp-icon slot="icon" size="m">
                ${ICONS.PLUS_ICON}
              </sp-icon>
              ${this.appStore.i18n('config_project_add')}
            </sk-menu-item>
          ` : html`
            <sk-menu-item class="icon-item destructive" value="project-removed" @click=${this.handleItemSelection}>
              <sp-icon slot="icon" size="m">
                ${ICONS.TRASH_ICON}
              </sp-icon>
              ${this.appStore.i18n('config_project_remove')}
            </sk-menu-item>
          `
      }
        ${this.projects.length > 0
        ? html`
          <sk-menu-item class="icon-item" value="project-admin-opened" @click=${this.handleItemSelection}>
            <sp-icon slot="icon" size="m">
              ${ICONS.GEAR_ICON}
            </sp-icon>
            ${this.appStore.i18n('config_project_manage')}
            <sp-icon class="experimental">
              ${ICONS.VIAL_ICON}
            </sp-icon>
          </sk-menu-item>
        ` : ''
        }
        <sk-menu-item class="icon-item" value="help-opened"  @click=${this.handleItemSelection}>
          <sp-icon slot="icon" size="m">
            ${ICONS.HELP_ICON}
          </sp-icon>
          ${this.appStore.i18n('help_documentation')}
        </sk-menu-item>        
        <sk-menu-item class="icon-item" value="whats-new-opened"  @click=${this.handleItemSelection}>
          <sp-icon slot="icon" size="m">
            ${ICONS.PRESENT_ICON}
          </sp-icon>
          ${this.appStore.i18n('whats_new')}
        </sk-menu-item>
        <sp-divider size="s"></sp-divider>
        <div class="theme-switch" value="theme" tabindex="-1">
          <sp-switch slot="toggle" checked=${ifDefined(this.appStore.theme === 'dark' ? true : undefined)} @change=${this.toggleTheme}>${this.appStore.i18n('dark_mode')}</sp-switch>
        </div>
      </sp-action-menu>`;
    systemPlugins.push(properties);

    const buttonType = [401, 403].includes(siteStore.status) ? 'not-authorized' : '';
    systemPlugins.push(html`
      <login-button id="user" class=${buttonType}></login-button>
    `);

    const actionGroup = html`<div class="action-group system-plugins-container">${systemPlugins}</div>`;
    const divider = html`<sp-menu-divider size="s" vertical></sp-menu-divider>`;

    return [divider, actionGroup];
  }

  render() {
    return this.appStore.state !== STATE.INITIALIZING ? html`
      <action-bar>
        ${this.renderLogo()}
        ${this.renderPlugins()}
        ${this.renderPluginMenu()}
        ${this.renderSystemPlugins()}
        ${this.renderBadgePlugins()}
        ${this.renderCloseButton()}
      </action-bar>
    ` : '';
  }
}
