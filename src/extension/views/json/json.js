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
import '../../app/components/spectrum/theme/theme.js';
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
   * The selected tab index
   * @type {number}
   */
  @property({ type: Number })
  accessor selectedTabIndex = 0;

  @queryAsync('sp-action-group')
  accessor actionGroup;

  @queryAsync('sp-table')
  accessor table;

  async connectedCallback() {
    super.connectedCallback();

    this.theme = await getConfig('local', 'theme') || 'light';
    document.body.setAttribute('color', this.theme);

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
    const { filteredData: json, url } = this;
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
          <p>${i18n(this.languageDict, 'json_results_stat').replace('$1', filteredCount).replace('$2', total)}</p>
        </div>
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
   * Align the order of columns within rows to the headers
   * @param {Object[]} rows The rows
   * @param {string[]} headers The header names
   * @returns {Object[]} The sorted rows
   */
  sortColumns(rows, headers) {
    return rows.map((row) => {
      const newRow = {};
      headers.forEach((key) => {
        newRow[key] = row[key] || '';
      });
      return newRow;
    });
  }

  /**
   * Render the table
   * @param {Object[]} rows The rows to render
   * @param {string[]} headers The header names
   * @param {string} url The url of the json file
   * @returns {HTMLDivElement} The rendered table
   */
  renderTable(rows, headers, url) {
    const tableContainer = document.createElement('div');
    tableContainer.classList.add('tableContainer');

    const table = document.createElement('sp-table');
    table.style.height = '100%';
    table.setAttribute('scroller', 'true');

    if (rows.length > 0) {
      const headHTML = headers.reduce((acc, key) => `${acc}<sp-table-head-cell sortable sort-direction="desc" sort-key=${key}>${key.charAt(0).toUpperCase() + key.slice(1)}</sp-table-head-cell>`, '');
      const head = document.createElement('sp-table-head');
      head.insertAdjacentHTML('beforeend', headHTML);
      table.appendChild(head);

      table.items = this.sortColumns(rows, headers);
      // @ts-ignore
      table.renderItem = (item) => html`${Object.values(item).map((value) => this.renderValue(value, url))}`;

      table.addEventListener('sorted', (event) => {
        // @ts-ignore
        const { sortDirection, sortKey } = event.detail;
        rows = rows.sort((a, b) => {
          const first = String(a[sortKey]);
          const second = String(b[sortKey]);
          return sortDirection === 'asc'
            ? first.localeCompare(second)
            : second.localeCompare(first);
        });
        table.items = [...rows];
      });

      tableContainer.appendChild(table);
    } else {
      const noResults = `
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
      `;
      tableContainer.innerHTML = noResults;
    }

    return tableContainer;
  }

  /**
   * Render the value as a cell in the table
   * @param {string} value The value to render
   * @param {string} url The url of the json file
   * @returns {TemplateResult} The rendered value
   */
  renderValue(value, url) {
    const valueContainer = document.createElement('div');
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
    } else if (value.startsWith('/') || value.startsWith('http')) {
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
    return html`<sp-table-cell>${valueContainer}</sp-table-cell>`;
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
      this.filteredData = this.originalData;
    } else {
      const filteredData = { ...this.originalData };
      const lowerCaseSearchString = this.filterText.toLowerCase();

      if (this.originalData[':type'] === 'multi-sheet') {
        Object.keys(this.originalData).forEach((sheetName) => {
          // Filter the data array in the current sheet
          if (this.originalData[sheetName] && this.originalData[sheetName].data) {
            const filteredSheetData = this.originalData[sheetName].data.filter((item) => Object
              .values(item).some((value) => value.toString().toLowerCase()
                .includes(lowerCaseSearchString),
              ));

            filteredData[sheetName] = { data: filteredSheetData ?? [] };
          }
        });
      } else {
        const filteredSheetData = this.originalData.data.filter((item) => Object
          .values(item).some((value) => value.toString().toLowerCase()
            .includes(lowerCaseSearchString),
          ));

        filteredData.data = filteredSheetData;
      }

      this.filteredData = filteredData;
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

  render() {
    return html`
      <theme-wrapper theme=${this.theme}>
        <div class="container">
          ${this.renderData()}
        </div>
      </theme-wrapper>
    `;
  }
}
