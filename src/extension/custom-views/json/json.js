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
import { html, LitElement, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import '@spectrum-web-components/theme/sp-theme.js';
import '@spectrum-web-components/theme/scale-medium.js';
import '@spectrum-web-components/theme/theme-dark.js';
import '@spectrum-web-components/theme/theme-light.js';
import '@spectrum-web-components/table/sp-table.js';
import '@spectrum-web-components/table/sp-table-body.js';
import '@spectrum-web-components/table/sp-table-cell.js';
import '@spectrum-web-components/table/sp-table-checkbox-cell.js';
import '@spectrum-web-components/table/sp-table-head.js';
import '@spectrum-web-components/table/sp-table-head-cell.js';
import '@spectrum-web-components/table/sp-table-row.js';
import '../../app/components/theme/theme.js';

const nearFuture = new Date().setUTCFullYear(new Date().getUTCFullYear() + 20);
const recentPast = new Date().setUTCFullYear(new Date().getUTCFullYear() - 20);

@customElement('json-view')
export class JSONView extends LitElement {
  /**
   * The json data
   * @type {Object}
   */
  @property({ type: Object })
  accessor data;

  /**
   * The url string
   * @type {string}
   */
  @property({ type: String })
  accessor url;

  static styles = css`
    :host {
      pointer-events: auto;
    }

    .container {
      width: 100%;
      height: 100%;
      color: var(--spectrum-global-color-gray-800);
      background-color: var(--spectrum-global-color-gray-200);
      padding: var(--spectrum-global-dimension-size-400);
      box-sizing: border-box;
    }

    sp-table-cell {
      word-break: break-word;
    }

    sp-table-cell ul {
      padding-inline-start: 10px;
      margin-block-start: 0;
    }

    sp-table-cell > div.image,
    sp-table-cell > div.video {
      padding: 0;
    }

    sp-table-cell > div img,
    sp-table-cell > div video {
      width: 100%;
      max-width: 240px;
    }
  `;

  async connectedCallback() {
    super.connectedCallback();

    try {
      const url = new URL(window.location.href).searchParams.get('url');
      if (url) {
        const res = await fetch(url);
        if (res.ok) {
          const text = await res.text();
          let json = {};
          try {
            json = JSON.parse(text);
          } catch (e) {
            throw new Error(`invalid json found at ${url}`);
          }
          this.url = url;
          this.data = json;
        } else {
          throw new Error(`failed to load ${url}: ${res.status}`);
        }
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('error rendering view', e);
    }
  }

  renderData() {
    const { data: json, url } = this;
    if (!json || !url) {
      return html``;
    }

    const sheets = {};
    const multiSheet = json[':type'] === 'multi-sheet' && json[':names'];
    if (multiSheet) {
      json[':names'].forEach((name) => {
        const { data } = json[name];
        if (data && data.length > 0) {
          sheets[name] = data;
        }
      });
    } else {
      const { data } = json;
      if (data && data.length > 0) {
        sheets['shared-default'] = data;
      }
    }

    const elements = [];

    Object.keys(sheets).forEach((name) => {
      const sheet = sheets[name];
      const title = document.body.appendChild(document.createElement('h2'));
      title.textContent = name;
      elements.push(title);

      elements.push(this.renderTable(sheet, url));
    });

    return elements;
  }

  renderTable(sheet, url) {
    const headers = sheet[0];
    const rows = sheet.slice(1);

    const table = document.createElement('sp-table');
    table.style.height = '90%';
    table.setAttribute('scroller', 'true');
    const head = table.appendChild(document.createElement('sp-table-head'));

    Object.keys(headers).forEach((key) => {
      const cell = head.appendChild(document.createElement('sp-table-head-cell'));
      cell.textContent = key;
    });

    table.items = rows;
    table.renderItem = (item) => html`${Object.values(item).map((value) => this.renderValue(value, url))}`;

    return table;
  }

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
        valueContainer.textContent = date.toUTCString();
      } else {
        // number
        valueContainer.classList.add('number');
        valueContainer.textContent = value;
      }
    } else if (value.startsWith('/') || value.startsWith('http')) {
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

  render() {
    return html`
      <theme-wrapper>
        <div class="container">
          ${this.renderData()}
        </div>
      </theme-wrapper>
    `;
  }
}
