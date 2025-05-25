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
import { html, LitElement } from 'lit';
import {
  customElement, property, queryAsync,
} from 'lit/decorators.js';
import '@spectrum-web-components/theme/sp-theme.js';
import '@spectrum-web-components/theme/spectrum-two/theme-light-core-tokens.js';
import '@spectrum-web-components/theme/spectrum-two/theme-dark-core-tokens.js';
import '@spectrum-web-components/theme/spectrum-two/scale-medium-core-tokens.js';
import '@spectrum-web-components/illustrated-message/sp-illustrated-message.js';
import '@spectrum-web-components/table/sp-table.js';
import '@spectrum-web-components/table/sp-table-body.js';
import '@spectrum-web-components/table/sp-table-cell.js';
import '@spectrum-web-components/table/sp-table-checkbox-cell.js';
import '@spectrum-web-components/table/sp-table-head.js';
import '@spectrum-web-components/table/sp-table-head-cell.js';
import '@spectrum-web-components/table/sp-table-row.js';
import '@spectrum-web-components/action-button/sp-action-button.js';
import '@spectrum-web-components/action-group/sp-action-group.js';
import '@spectrum-web-components/icons-workflow/icons/sp-icon-close.js';
import '@spectrum-web-components/switch/sp-switch.js';
import '@spectrum-web-components/progress-circle/sp-progress-circle.js';
import '../../app/components/theme/theme.js';
import '../../app/components/search/search.js';
import { fetchLanguageDict, getLanguage, i18n } from '../../app/utils/i18n.js';
import { style } from './json.css.js';
import { spectrum2 } from '../../app/spectrum-2.css.js';
import sampleRUM from '../../utils/rum.js';
import { getConfig } from '../../config.js';

/**
 * The lit template result type
 * @typedef {import('lit').TemplateResult} TemplateResult
 */

const nearFuture = new Date().setUTCFullYear(new Date().getUTCFullYear() + 20);
const recentPast = new Date().setUTCFullYear(new Date().getUTCFullYear() - 20);
const LOW_BATCH_SIZE = 5000;
const HIGH_BATCH_SIZE = 10000;
const DEFAULT_BATCH_SIZE = 1000;

@customElement('json-view')
export class JSONView extends LitElement {
  static get styles() {
    return [spectrum2, style];
  }

  /**
   * The original json data
   * @type {Object}
   */
  @property({ type: Object, state: false })
  accessor originalData;

  /**
   * The language dictionary`
   * @type {Object}
   */
  @property({ type: Object, state: false })
  accessor languageDict;

  /**
   * The filtered json data
   * @type {Object}
   */
  @property({ type: Object })
  accessor filteredData;

  /**
   * The original diff json data
   * @type {Object}
  */
  @property({ type: Object })
  accessor originalDiffData;

  /**
   * The diff json data
   * @type {Object}
   */
  @property({ type: Object })
  accessor diffData;

  /**
   * The filtered json data
   * @type {string}
   */
  @property({ type: String })
  accessor filterText;

  /**
   * The url string
   * @type {string}
   */
  @property({ type: String })
  accessor url;

  /**
   * The live version of the JSON data
   * @type {Object}
   */
  @property({ type: Object, state: false })
  accessor liveData;

  /**
   * The diff view mode
   * @type {boolean}
   */
  @property({ type: Boolean })
  accessor diffMode = false;

   /**
   * The flag for live data loaded
   * @type {boolean}
   */
   @property({ type: Boolean })
   accessor liveDataLoaded = false;

    /**
     * Show all rows in diff view
     * @type {boolean}
     */
    @property({ type: Boolean })
    accessor showAll = false;

   /**
   * The selected theme from sidekick
   * @type {string}
   */
   @property({ type: String })
   accessor theme;

  /**
   * The selected tab index
   * @type {number}
   */
  @property({ type: Number })
  accessor selectedTabIndex = 0;

  @queryAsync('sp-action-group')
  accessor actionGroup;

  @queryAsync('sp-table')
  accessor table;

  @property({ type: Boolean })
  accessor isLoading = false;

  async connectedCallback() {
    super.connectedCallback();

    this.theme = await getConfig('local', 'theme') || 'dark';
    document.body.setAttribute('color', this.theme);
    chrome.storage.onChanged.addListener(async (changes, area) => {
      if (area === 'local' && changes.theme?.newValue) {
        this.theme = await getConfig('local', 'theme');
        document.body.setAttribute('color', this.theme);
      }
    });
    const lang = getLanguage();
    this.languageDict = await fetchLanguageDict(undefined, lang);

    try {
      const url = new URL(window.location.href).searchParams.get('url');
      if (url) {
        const res = await fetch(url, { cache: 'no-store' });
        if (res.ok) {
          let json = {};
          try {
            json = await res.json();
          } catch (e) {
            throw new Error(`invalid json found at ${url}`);
          }
          this.url = url;
          this.originalData = json;
          this.filteredData = json;
        } else {
          throw new Error(`failed to load ${url}: ${res.status}`);
        }
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('error rendering view', e);
    }

    // Wait for 3 seconds after last search input to track RUM
    this.debouncedFilterRUM = this.debounceFilterRUM(this.trackFilterRUM.bind(this), 3000);
  }

  /**
   * Render the json data
   */
  renderData() {
    const json = this.diffMode && this.diffData ? this.diffData : this.filteredData;
    const { url } = this;
    if (!json || !url) {
      return '';
    }

    if (!json[':type']) {
      // Not a sheet backed json file, close view
      this.onCloseView(false);
      return [];
    }

    const sheets = {};
    const multiSheet = json[':type'] === 'multi-sheet' && json[':names'];
    if (multiSheet) {
      json[':names'].forEach((name) => {
        const { data, columns } = json[name];
        if (data && columns) {
          sheets[name] = json[name];
        }
      });
    } else {
      const { data, columns } = json;
      if (data && columns) {
        sheets['shared-default'] = json;
      }
    }

    if (Object.keys(sheets).length === 0) {
      // No valid sheets found, close view
      this.onCloseView(false);
      return '';
    }

    const elements = [];
    const { searchParams } = new URL(window.location.href);

    const header = html`
      <div class="header">
        <div class="left">
        <svg width="250" height="245" viewBox="0 0 250 245" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M47.5 3H202.5C226 3 245 22 245 45.5V194.5C245 218 226 237 202.5 237H47.5C24 237 5 218 5 194.5V45.5C5 22 24 3 47.5 3Z" fill="black"/>
          <path d="M192 179H163C160.3 179.2 157.9 177.5 157 175L126 103C126 102.4 125.6 102 125 102C124.4 102 124 102.4 124 103L104 149C104 150.1 104.9 151 106 151H127C128.3 150.9 129.6 151.7 130 153L139 174C139.6 176.1 138.4 178.3 136.2 178.9C136.1 178.9 136 178.9 136 179H59C56.8 178.5 55.5 176.4 55.9 174.2C55.9 174.1 55.9 174 56 174L105 57C106.1 54.7 108.4 53.1 111 53H139C141.6 53.1 143.9 54.7 145 57L195 174C195.6 176.1 194.4 178.3 192.2 178.9C192.2 179 192.1 179 192 179Z" fill="#FA0F00"/>
        </svg>
        <h1>Adobe Experience Manager Sites <span>${searchParams.get('title')}</span></h1>
        </div>
        <div class="center">
          <sp-search @input=${this.onSearch} @submit=${(e) => e.preventDefault()} placeholder=${i18n(this.languageDict, 'search')}></sp-search>
        </div>
        <div class="right">
          <button variant="primary" @click=${this.onCloseView}><sp-icon-close></sp-icon-close></button>
        </div>
      </div>
    `;

    elements.push(header);

    const filteredCount = this.filteredData?.data?.length
      ?? Object.values(this.filteredData || {})[this.selectedTabIndex]?.data.length
      ?? 0;

    const diffFilteredCount = this.diffData?.data?.length
      ?? Object.values(this.diffData || {})[this.selectedTabIndex]?.data.length
      ?? 0;

    const total = this.originalData?.total
      ?? Object.values(this.originalData || {})[this.selectedTabIndex]?.total
      ?? 0;

    const actions = html`
      <div class="actions">
        <sp-action-group selects="single" @change=${this.onSelectionChange}>
          ${Object.keys(sheets).map((name, index) => html`
            <sp-action-button value=${index.toString()} .selected=${index === this.selectedTabIndex}>${name}</sp-action-button>
          `)}
        </sp-action-group>
        <div class="stats">
          ${this.diffMode ? html`
            <p>${i18n(this.languageDict, 'json_results_stat').replace('$1', diffFilteredCount).replace('$2', total)}</p>
          ` : html`
            <p>${i18n(this.languageDict, 'json_results_stat').replace('$1', filteredCount).replace('$2', total)}</p>
          `}
        </div>
        <sp-action-group>
          ${this.url.includes('.page') ? html`
            ${this.diffMode ? html`
              <label class="checkbox-label">
                <input type="checkbox" 
                  ?checked=${this.showAll} 
                  @change=${this.toggleShowAll}>
                ${i18n(this.languageDict, 'show_all')}
              </label>
            ` : ''}
            <sp-switch @change=${this.toggleDiffView} ?checked=${this.diffMode}>
                ${i18n(this.languageDict, 'show_diff')}
            </sp-switch>
          ` : ''}
        </sp-action-group>
      </div>
    `;
    elements.push(actions);
    const names = Object.keys(sheets);
    if (names.length > 0) {
      const name = names[this.selectedTabIndex];
      const sheet = sheets[name];
      const { data, columns } = sheet;
      elements.push(this.renderTable(data, columns, url));
    }
    return elements;
  }

  /**
   * Handle the table sorted event
   */
  onTableSorted(event) {
    const { sortDirection, sortKey } = event.detail;
    const data = this.diffMode
      ? this.diffData?.data || []
      : this.filteredData?.data || [];
    const columns = this.diffMode
      ? this.diffData?.columns || []
      : this.filteredData?.columns || [];
    const sortedData = [...data].sort((a, b) => {
      const first = String(a[sortKey]);
      const second = String(b[sortKey]);
      return sortDirection === 'asc'
        ? first.localeCompare(second)
        : second.localeCompare(first);
    });
    if (this.diffMode) {
      this.diffData = { ...this.diffData, data: sortedData, columns };
    } else {
      this.filteredData = { ...this.filteredData, data: sortedData, columns };
    }
    this.table.items = this.sortColumns(sortedData, columns);
  }

  /**
   * Align the order of columns within rows to the headers
   * @param {Object[]} rows The rows
   * @param {string[]} headers The header names
   * @returns {Object[]} The sorted rows
   */
  sortColumns(rows, headers) {
    return rows.map((row) => {
      const newRow = {};
      // Preserve diff and line information
      if (row.diff) newRow.diff = row.diff;
      if (row.line) newRow.line = row.line;
      // Sort other columns according to headers
      headers.forEach((key) => {
        newRow[key] = row[key] || '';
      });
      return newRow;
    });
  }

  /**
   * Format the value for the table
   * @param {string} value The value to format
   * @param {string} url The url of the json file
   * @returns {TemplateResult} The formatted value
  */
  formatValue(value, url) {
    const valueContainer = document.createElement('div');
    let dir = 'ltr';
    // Handle regular values
    if (value && !Number.isNaN(+value)) {
      // check for date
      const date = +value > 99999
        ? new Date(+value * 1000)
        : new Date(Math.round((+value - (1 + 25567 + 1)) * 86400 * 1000)); // excel date
      if (date.toString() !== 'Invalid Date'
        && nearFuture > date.valueOf() && recentPast < date.valueOf()) {
        valueContainer.classList.add('date');
        valueContainer.textContent = date.toLocaleString();
      } else {
        // number
        valueContainer.classList.add('number');
        valueContainer.textContent = value;
      }
    } else if (/^\/[a-z0-9]+/i.test(value) || value.startsWith('http')) {
      // check if the value contains a glob pattern
      if (!value.includes('*')) {
        // assume link
        const link = valueContainer.appendChild(document.createElement('a'));
        const target = new URL(value, url).toString();
        link.href = target;
        link.title = value;
        link.target = '_blank';
        if (value.endsWith('.mp4')) {
          // linked mp4 video
          valueContainer.classList.add('video');
          const video = link.appendChild(document.createElement('video'));
          const source = video.appendChild(document.createElement('source'));
          source.src = target;
          source.type = 'video/mp4';
        } else if (value.includes('media_')) {
          // linked image
          valueContainer.classList.add('image');
          const img = link.appendChild(document.createElement('img'));
          img.src = target;
        } else {
          // text link
          link.textContent = value;
        }
      } else {
        // Text
        valueContainer.textContent = value;
      }
    } else if (value.startsWith('[') && value.endsWith(']')) {
      // assume array
      valueContainer.classList.add('list');
      const list = valueContainer.appendChild(document.createElement('ul'));
      JSON.parse(value).forEach((v) => {
        const item = list.appendChild(document.createElement('li'));
        item.textContent = v;
      });
    } else {
      // text
      valueContainer.textContent = value;
    }
    // check if the value contains any rtl characters
    if (/[\u0590-\u06FF]/.test(valueContainer.textContent)) {
      dir = 'rtl';
    }
    return html`<div dir=${dir}>${valueContainer}</div>`;
  }

  /**
   * Render the table
   * @param {Object[]} rows The rows to render
   * @param {string[]} headers The header names
   * @param {string} url The url of the json file
   * @returns {TemplateResult} The rendered table
   */
  renderTable(rows, headers, url) {
    if (rows.length === 0) {
      return html`
        <div class="tableContainer">
          ${this.filterText ? html`
            <sp-illustrated-message
              heading="${i18n(this.languageDict, 'no_results')}"
              description="${i18n(this.languageDict, 'no_results_subheading')}"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="99.039" height="94.342">
                <g fill="none" strokeLinecap="round" strokeLinejoin="round" >
                  <path d="M93.113 88.415a5.38 5.38 0 0 1-7.61 0L58.862 61.773a1.018 1.018 0 0 1 0-1.44l6.17-6.169a1.018 1.018 0 0 1 1.439 0l26.643 26.643a5.38 5.38 0 0 1 0 7.608z" strokeWidth="2.99955"/>
                  <path strokeWidth="2" d="M59.969 59.838l-3.246-3.246M61.381 51.934l3.246 3.246M64.609 61.619l13.327 13.327" />
                  <path strokeWidth="3" d="M13.311 47.447A28.87 28.87 0 1 0 36.589 1.5c-10.318 0-20.141 5.083-24.7 13.46M2.121 38.734l15.536-15.536M17.657 38.734L2.121 23.198" />
                </g>
              </svg>
            </sp-illustrated-message>
          ` : html`
            <sp-illustrated-message
              heading="${i18n(this.languageDict, 'no_data')}"
              description="${i18n(this.languageDict, 'no_data_subheading')}"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="100.25" height="87.2">
                <path d="M94.55,87.2H5.85c-3.1,0-5.7-2.5-5.7-5.7V5.7C.15,2.6,2.65,0,5.85,0h88.7c3.1,0,5.7,2.5,5.7,5.7v75.8c0,3.1-2.5,5.7-5.7,5.7ZM5.85.5C2.95.5.65,2.8.65,5.7v75.8c0,2.9,2.3,5.2,5.2,5.2h88.7c2.9,0,5.2-2.3,5.2-5.2V5.7c0-2.9-2.3-5.2-5.2-5.2H5.85Z"/>
                <rect x=".45" y="15.5" width="99.5" height=".5"/>
                <rect x=".45" y="33.1" width="99.5" height=".5"/>
                <rect x=".45" y="51.2" width="99.5" height=".5"/>
                <rect x=".45" y="69.4" width="99.5" height=".5"/>
                <rect x="33.33" y="15.1" width=".5" height="71.8"/>
                <rect x="66.67" y="15.1" width=".5" height="71.8"/>
              </svg>
            </sp-illustrated-message>
          `}
        </div>
      `;
    }

    const tableContainer = document.createElement('div');
    tableContainer.classList.add('tableContainer');
    const table = document.createElement('sp-table');
    table.setAttribute('scroller', 'true');
    table.style.height = '100%';
    table.addEventListener('sorted', this.onTableSorted);
    const headHTML = `
    <sp-table-head>
      ${rows.some((r) => r.line) ? '<sp-table-head-cell sortable sort-direction="desc" sort-key="line" class="line">#</sp-table-head-cell>' : ''}
      ${headers.map((header) => `<sp-table-head-cell sortable sort-direction="desc" sort-key="${header}">${header.charAt(0).toUpperCase() + header.slice(1)}</sp-table-head-cell>`).join('')}
    </sp-table-head>`;
    table.insertAdjacentHTML('beforeend', headHTML);
    table.items = this.sortColumns(rows, headers);
    table.renderItem = (item) => html`
          ${item.line ? html`<sp-table-cell class="line" data-diff=${item.diff || ''}>${item.line}</sp-table-cell>` : ''}
          ${Object.entries(item)
            .filter(([key]) => key !== 'diff' && key !== 'line')
            // @ts-ignore
            .map(([_, value]) => this.renderValue(value, url))}
    `;
    tableContainer.appendChild(table);
    return html`${tableContainer}`;
  }

  /**
   * Render the value as a cell in the table
   * @param {string} value The value to render
   * @param {string} url The url of the json file
   * @returns {TemplateResult} The rendered value
   */
  renderValue(value, url) {
    if (!value) {
      return html`<sp-table-cell></sp-table-cell>`;
    }
    const typedValue = /** @type {any} */ (value);
    // Handle diff values
    if (this.diffMode && typedValue !== null && typeof typedValue === 'object' && 'diff' in typedValue) {
      return html`
        <sp-table-cell>
          <div class="diff-value ${typedValue.diff}">
            ${typedValue.preview !== undefined && typedValue.live !== undefined ? html`
              <div class="preview">${this.formatValue(typedValue.preview, url)}</div>
              <div class="live">${this.formatValue(typedValue.live, url)}</div>
            ` : JSON.stringify(typedValue)}
          </div>
        </sp-table-cell>
      `;
    }

    // Handle regular values
    return html`<sp-table-cell>${this.formatValue(value, url)}</sp-table-cell>`;
  }

  /**
   * Link the scroll events of the table head and body
   */
  async updated() {
    await this.updateComplete;
    const table = await this.table;
    if (table) {
      const tableHead = table.querySelector('sp-table-head');
      const tableBody = table.querySelector('sp-table-body');
      tableHead.addEventListener('scroll', () => {
        tableBody.scrollLeft = tableHead.scrollLeft;
      });
      tableBody.addEventListener('scroll', () => {
        tableHead.scrollLeft = tableBody.scrollLeft;
      });
    }
  }

  /**
   * Debounce the rum tracking
   */
  debounceFilterRUM(func, wait) {
    let timeout;

    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };

      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * RUM tracking for the filter
   */
  trackFilterRUM() {
    sampleRUM('click', {
      source: 'sidekick',
      target: 'jsonview:filtered',
    });
  }

  /**
   * Handle the search event
   * @param {*} event The search event
   */
  onSearch(event) {
    this.filterText = event.target.value;
    if (!this.filterText) {
      this.diffData = this.originalDiffData;
      this.filteredData = this.diffMode ? { ...this.diffData } : { ...this.originalData };
    } else {
      const filteredData = this.diffMode ? { ...this.diffData } : { ...this.originalData };
      const lowerCaseSearchString = this.filterText.toLowerCase();

      if (filteredData[':type'] === 'multi-sheet') {
        Object.keys(filteredData).forEach((sheetName) => {
          // Filter the data array in the current sheet
          if (filteredData[sheetName] && filteredData[sheetName].data) {
            const filteredSheetData = filteredData[sheetName].data.filter((item) => Object
              .values(item).some((value) => value.toString().toLowerCase()
                .includes(lowerCaseSearchString),
              ));
            const { columns } = filteredData[sheetName];
            filteredData[sheetName] = { data: filteredSheetData ?? [], columns };
          }
        });
      } else {
        const filteredSheetData = filteredData.data.filter((item) => Object
          .values(item).some((value) => value.toString().toLowerCase()
            .includes(lowerCaseSearchString),
          ));

        filteredData.data = filteredSheetData;
      }
      if (this.diffMode) {
        this.diffData = filteredData;
      } else {
        this.filteredData = filteredData;
      }
    }
    this.debouncedFilterRUM();
  }

  /**
   * Handle the tab change event
   */
  async onSelectionChange() {
    const actionGroup = await this.actionGroup;
    this.selectedTabIndex = parseInt(actionGroup.selected[0], 10);
    sampleRUM('click', {
      source: 'sidekick',
      target: 'jsonview:tab-switched',
    });
  }

  /**
   * Close the json view
   */
  onCloseView(trackRum = true) {
    const customEventDetail = { detail: { event: 'hlx-close-view' } };
    window.parent.postMessage(customEventDetail, '*');
    if (trackRum) {
      sampleRUM('click', {
        source: 'sidekick',
        target: 'jsonview:closed',
      });
    }
  }

  /**
   * Fetch all items from the JSON endpoint
   * @param {string} url The base URL
   * @param {number} total Total number of items
   * @returns {Promise<Object>} The complete JSON data
   */
  async fetchAllItems(url, total, isLive = false) {
    this.isLoading = true;
    try {
      if (total <= DEFAULT_BATCH_SIZE) {
        return isLive ? this.liveData : this.originalData;
      }
      const batchSize = total > HIGH_BATCH_SIZE ? HIGH_BATCH_SIZE : LOW_BATCH_SIZE;
      const allData = isLive ? { ...this.liveData } : { ...this.originalData };
      const batches = Math.ceil((total - DEFAULT_BATCH_SIZE) / batchSize);

      const batchRequests = Array.from({ length: batches }, (_, i) => {
        const offset = DEFAULT_BATCH_SIZE + (i * batchSize);
        const limit = Math.min(batchSize, total - offset);
        const batchUrl = new URL(url);
        batchUrl.searchParams.set('offset', offset.toString());
        batchUrl.searchParams.set('limit', limit.toString());
        return fetch(batchUrl.toString());
      });

      const responses = await Promise.all(batchRequests);
      const batchDataPromises = responses.map(async (res, i) => {
        if (!res.ok) {
          const offset = DEFAULT_BATCH_SIZE + (i * batchSize);
          throw new Error(`Failed to fetch batch at offset ${offset}: ${res.status}`);
        }
        return res.json();
      });

      const batchDataResults = await Promise.all(batchDataPromises);
      batchDataResults.forEach((batchData) => {
        if (batchData.data) {
          allData.data = [...allData.data, ...batchData.data];
        }
      });

      return allData;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Toggle diff view mode
   */
  async toggleDiffView() {
    this.diffMode = !this.diffMode;
    if (this.diffMode && !this.liveDataLoaded && !this.liveData && !this.originalDiffData) {
      try {
        // Fetch live version
        const liveUrl = this.url.replace('.page', '.live');
        const liveRes = await fetch(liveUrl, { cache: 'no-store' });
        const previewTotal = this.originalData.total || 0;
        if (liveRes.ok) {
          this.liveData = await liveRes.json();
          // Fetch all items if needed
          const liveTotal = this.liveData.total || 0;
          if (previewTotal > DEFAULT_BATCH_SIZE || liveTotal > DEFAULT_BATCH_SIZE) {
            this.originalData = await this.fetchAllItems(this.url, previewTotal);
            this.liveData = await this.fetchAllItems(liveUrl, liveTotal, true);
          }
          this.diffData = this.computeDiff(this.originalData, this.liveData);
          this.originalDiffData = this.diffData;
        } else if (liveRes.status === 404) {
          // If live version doesn't exist yet, treat it as empty
          this.liveData = { data: [], columns: this.originalData.columns };
          if (previewTotal > DEFAULT_BATCH_SIZE) {
            this.originalData = await this.fetchAllItems(this.url, previewTotal);
          }
          this.diffData = this.computeDiff(this.originalData, this.liveData);
          this.originalDiffData = this.diffData;
        }
        this.liveDataLoaded = true;
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn(`Could not load live version: ${e}`);
      }
    } else if (this.diffMode && this.liveData && !this.originalDiffData) {
      this.diffData = this.computeDiff(this.originalData, this.liveData);
      this.originalDiffData = this.diffData;
    } else {
      this.filteredData = this.originalData;
    }
  }

  /**
   * Toggle show all rows
   * @param {Event} event The change event
   */
  toggleShowAll(event) {
    const checkbox = /** @type {HTMLInputElement} */ (event.target);
    this.showAll = checkbox.checked;
    if (this.diffMode && this.liveData) {
      this.diffData = this.computeDiff(this.originalData, this.liveData);
      this.originalDiffData = this.diffData;
      if (this.filterText) {
        this.onSearch({ target: { value: this.filterText } });
      }
    }
  }

  /**
   * Helper to create a unique key for a row
   * @param {Object} row The row
   * @returns {string} The unique key
   */
  getRowKey(row) {
    const rowKey = Object.entries(row)
      .filter(([key]) => !key.startsWith(':') && key !== 'diff' && key !== 'line') // Exclude metadata fields
      .map(([key, value]) => `${key}:${value}`)
      .join('|');
    return rowKey;
  }

  /**
   * Compare rows between preview and live versions
   * @param {Object} preview The preview version
   * @param {Object} live The live version
   * @param {Object} diff The diff object
   */
  compareRows(preview, live, diff) {
    if (preview && live) {
      const { data: previewData, columns } = preview;
      const { data: liveData } = live;

      if (previewData && liveData) {
        const previewMap = new Map();
        const liveMap = new Map();
        previewData.forEach((row, index) => {
          const key = this.getRowKey(row);
          previewMap.set(key, { row, index });
        });
        liveData.forEach((row, index) => {
          const key = this.getRowKey(row);
          liveMap.set(key, { row, index });
        });

        const allKeys = new Set([...previewMap.keys(), ...liveMap.keys()]);
        // build diff data
        const diffData = [];
        [...allKeys].sort().forEach((key) => {
          const previewItem = previewMap.get(key);
          const liveItem = liveMap.get(key);

          if (!previewItem) {
            // Only in live
            diffData.push({ ...liveItem.row, diff: 'removed', line: liveItem.index + 1 });
          } else if (!liveItem) {
            // Only in preview
            diffData.push({ ...previewItem.row, diff: 'added', line: previewItem.index + 1 });
          } else {
            // In both - check for modifications
            const hasChanges = Object.keys(previewItem.row).some(
              (field) => {
                if (field !== 'diff' && field !== 'line' && !field.startsWith(':')) {
                  return previewItem.row[field] !== liveItem.row[field];
                }
                return false;
              },
            );

            if (hasChanges) {
              diffData.push({ ...liveItem.row, diff: 'removed', line: liveItem.index + 1 });
              diffData.push({ ...previewItem.row, diff: 'added', line: previewItem.index + 1 });
            } else {
              diffData.push({ ...previewItem.row, line: previewItem.index + 1 });
            }
          }
        });
        diffData.sort((a, b) => {
          if (a.line - b.line === 0) {
            if (a.diff && b.diff) {
              return a.diff.localeCompare(b.diff);
            } else if (a.diff) {
              return 1;
            } else if (b.diff) {
              return -1;
            }
            return 0;
          }
          return a.line - b.line;
        });
        diff = { data: diffData, columns };
      }
    }
    return diff;
  }

  /**
   * Compute diff between preview and live versions
   * @param {Object} preview The preview version
   * @param {Object} live The live version
   * @returns {Object} The diff result
   */
  computeDiff(preview, live) {
    if (!preview || !live) {
      // eslint-disable-next-line no-console
      console.warn('Missing preview or live data:', { preview: !!preview, live: !!live });
      return preview;
    }

    const diff = { ...preview };
    if (preview[':type'] === 'multi-sheet' && preview[':names']) {
      preview[':names'].forEach((name) => {
        const differences = this.compareRows(
          preview[name],
          live[name],
          diff,
        );
        diff[name] = differences;
      });
    } else {
      const differences = this.compareRows(
        preview,
        live,
        diff,
      );
      diff.data = differences.data;
      diff.columns = differences.columns;
    }

    // Filter to show only changed rows if showAll is false
    if (!this.showAll) {
      if (diff[':type'] === 'multi-sheet' && diff[':names']) {
        diff[':names'].forEach((name) => {
          if (diff[name] && diff[name].data) {
            diff[name].data = diff[name].data.filter((row) => row.diff);
          }
        });
      } else if (diff.data) {
        diff.data = diff.data.filter((row) => row.diff);
      }
    }
    return diff;
  }

  render() {
    return html`
      <theme-wrapper theme=${this.theme}>
        <div class="container">
          ${this.isLoading ? html`
            <div class="loading-overlay">
              <sp-progress-circle indeterminate></sp-progress-circle>
              <p>${i18n(this.languageDict, 'loading_diff')}</p>
            </div>
          ` : ''}
          ${this.renderData()}
        </div>
      </theme-wrapper>
    `;
  }
}
