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
import { customElement, queryAll, queryAsync } from 'lit/decorators.js';
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
 * The gap between plugins in the plugin group
 */
const PLUGIN_GROUP_GAP = 8;

/**
 * The maximum width of the action bar
 */
const ACTION_BAR_MAX_WIDTH = 800;

/**
 * The threshold for overflow
 */
const OVERFLOW_THRESHOLD = -10;

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
   * The plugins visible in the action bar.
   * @type {Plugin[]}
   */
  barPlugins = [];

  /**
   * The plugins folded into the action menu.
   * @type {Plugin[]}
   */
  menuPlugins = [];

  /**
   * The plugins temporarily folded into the action menu.
   * @type {Plugin[]}
   */
  transientPlugins = [];

  /**
   * The current width of the action bar.
   * @type {number}
   */
  actionBarWidth = 0;

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
  resizeThrottleTimer = null;

  /**
   * Throttle timer for checkOverflow
   * @type {number|null}
   */
  overflowThrottleTimer = null;

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

  /**
   * Set up the bar and menu plugins in this environment and updates the component.
   */
  setupPlugins() {
    this.transientPlugins = [];

    this.visiblePlugins = [
      ...Object.values(this.appStore.corePlugins),
      ...Object.values(this.appStore.customPlugins),
    ].filter((plugin) => plugin.isVisible());

    this.barPlugins = this.visiblePlugins
      .filter((plugin) => plugin.isPinned() && !plugin.isBadge());

    this.menuPlugins = this.visiblePlugins
      .filter((plugin) => !plugin.isPinned() && !plugin.isBadge());

    this.badgePlugins = this.visiblePlugins
      .filter((plugin) => plugin.isBadge());

    this.requestUpdate();
  }

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

    this.requestUpdate();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('click', this.onClick);
    window.removeEventListener('resize', this.onWindowResize);
    EventBus.instance.removeEventListener(EVENTS.CLOSE_POPOVER);
    this.removeDragHandler();

    // Clear any pending throttled resize
    if (this.resizeThrottleTimer) {
      clearTimeout(this.resizeThrottleTimer);
      this.resizeThrottleTimer = null;
    }

    // Clear any pending throttled overflow check
    if (this.overflowThrottleTimer) {
      clearTimeout(this.overflowThrottleTimer);
      this.overflowThrottleTimer = null;
    }
  }

  /**
   * Handle window resize
   */
  onWindowResize = () => {
    // Throttle resize handling to avoid performance issues
    if (this.resizeThrottleTimer) {
      return;
    }

    // @ts-ignore
    this.resizeThrottleTimer = setTimeout(() => {
      if (this.hasAttribute('style')) {
        // Below 800px, remove custom positioning
        if (window.innerWidth < ACTION_BAR_MAX_WIDTH) {
          this.removeAttribute('style');
        } else {
          // Restrict custom positioning to viewport
          this.constrainToViewport();
        }
      }
      // Check for plugin overflow
      this.checkOverflow();

      this.resizeThrottleTimer = null;
    }, 150);
  };

  /**
   * Set up drag handlers for the action bar
   */
  async setupDragHandler() {
    const dragHandle = await this.dragHandle;
    if (dragHandle) {
      dragHandle.addEventListener('mousedown', this.onDragStart, false);
    }
  }

  /**
   * Remove drag handlers
   */
  async removeDragHandler() {
    const dragHandle = await this.dragHandle;
    if (dragHandle) {
      dragHandle.removeEventListener('mousedown', this.onDragStart, false);
    }
  }

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

    // this.appStore.sampleRUM('click', { source: 'sidekick', target: 'sidekick-dragged' });

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
    if (rect.left < 0) {
      // Too far left
      newTranslateX = translateX - rect.left + 10;
    } else if (rect.right > viewportWidth) {
      // Too far right
      newTranslateX = translateX - (rect.right - viewportWidth) - 10;
    }

    // Check vertical bounds
    let newBottom = currentBottom;
    if (rect.top < 0) {
      // Too far up - decrease bottom to move element down
      newBottom = Math.max(0, currentBottom + rect.top - 10);
    } else if (rect.bottom > viewportHeight) {
      // Too far down - increase bottom to move element up
      newBottom = currentBottom + (rect.bottom - viewportHeight) + 10;
    }

    // Apply constrained position
    this.style.left = '50%';
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

  async checkOverflow() {
    // Throttle overflow checking to avoid performance issues
    if (this.overflowThrottleTimer) {
      return;
    }

    // Set throttle timer to prevent rapid re-execution
    // @ts-ignore
    this.overflowThrottleTimer = setTimeout(() => {
      this.overflowThrottleTimer = null;
    }, 150);

    if (this.actionGroups.length < 3) {
      // wait for all action groups to be rendered
      return;
    }

    const [logoContainer, closeButton] = await Promise.all([this.logoContainer, this.closeButton]);

    // Action bar styles
    const barWidth = parseInt(window.getComputedStyle(this).width, 10);
    const logoWidth = this.getTotalWidth(logoContainer);
    const closeButtonWidth = parseInt(window.getComputedStyle(closeButton).width, 10);

    const [pluginGroup, pluginMenu, systemGroup] = this.actionGroups;

    // Left plugin container styles
    const pluginGroupStyles = window.getComputedStyle(pluginGroup);
    const pluginGroupPadding = parseInt(pluginGroupStyles.padding, 10);
    const pluginGroupWidth = parseInt(pluginGroupStyles.width, 10);
    const pluginGroupWidthIncludingPadding = pluginGroupWidth + (pluginGroupPadding * 2);

    const pluginMenuWidth = this.getTotalWidth(pluginMenu);
    const systemWidth = this.getTotalWidth(systemGroup);

    // Combined width of system plugins, plugin menu, and close button
    const rightWidth = pluginMenuWidth + systemWidth + closeButtonWidth;

    // Combined width of left logo and plugin group
    const leftWidth = pluginGroupWidthIncludingPadding + logoWidth;

    // Total free space in the bar, minus 3px to account for the dividers
    const totalFreeSpace = barWidth - leftWidth - rightWidth - 3;

    // If there's not enough space for the plugins in the bar, move the last plugin to the menu
    // We check against -10 to avoid endless loop caused after a plugin is added to back to the bar
    if (totalFreeSpace <= OVERFLOW_THRESHOLD && this.barPlugins.length > 1) {
      this.transientPlugins.unshift(this.barPlugins.pop());
      this.requestUpdate();
    // If we don't need to remove a plugin and if the action bar is less than 800px wide,
    // the logic must adjust to check if there's space for the next plugin
    } else if (window.innerWidth < ACTION_BAR_MAX_WIDTH) {
      const nextPlugin = this.transientPlugins[0];
      if (nextPlugin) {
        const children = Array.from(this.actionGroups[0].children);

        let childrenWidth = children.reduce((acc, child) => acc + child.clientWidth, 0);
        // Account for the gap between the plugins
        childrenWidth += (children.length - 1) * PLUGIN_GROUP_GAP;

        // Calculate the hypothetical new width of the plugins group if we added the next plugin
        const nextPluginWidth = nextPlugin.getEstimatedWidth();
        const newWidth = nextPluginWidth + childrenWidth + PLUGIN_GROUP_GAP;

        // If the new width is less than the plugin group width, add the plugin to the bar
        if (newWidth < pluginGroupWidth) {
          this.barPlugins.push(this.transientPlugins.shift());
          this.requestUpdate();
        }
      }
    } else {
      // If the action bar is wider than 800px, and we don't need to remove a plugin, check if there's space for the next plugin
      const extraSpace = ACTION_BAR_MAX_WIDTH - barWidth;
      if (this.transientPlugins.length > 0) {
        const nextPlugin = this.transientPlugins[0];
        if (nextPlugin) {
          const nextPluginWidth = nextPlugin.getEstimatedWidth();
          if (nextPluginWidth < extraSpace) {
            this.barPlugins.push(this.transientPlugins.shift());
            this.requestUpdate();
          }
        }
      }
    }

    this.actionBarWidth = barWidth;
  }

  firstUpdated() {
    window.addEventListener('resize', this.onWindowResize);
    setTimeout(this.setupDragHandler.bind(this), 1000);
  }

  async updated() {
    await this.updateComplete;
    this.checkOverflow();
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
        <div class="drag-handle" title="${this.appStore.i18n('drag_to_reposition')}">
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

    return html`
      <div class=${`action-group plugin-menu-container ${this.menuPlugins.length === 0 ? 'hidden' : ''}`}>
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
