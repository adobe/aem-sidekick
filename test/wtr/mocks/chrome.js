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

import { readFile } from '@web/test-runner-commands';

const ID = 'dummy';

const TABS = {
  1: {
    id: 1,
    url: 'https://main--blog--adobe.hlx.page/',
  },
  2: {
    id: 2,
    url: 'https://www.example.com/',
  },
  3: {
    id: 2,
    url: 'http://localhost:3000/',
  },
};

class StorageMock {
  constructor(state = {}) {
    this.state = state;
  }

  async get(name) {
    return {
      [name]: this.state[name],
    };
  }

  set(obj) {
    Object.keys(obj).forEach((key) => {
      this.state[key] = obj[key];
    });
  }

  remove(name) {
    delete this.state[name];
  }

  clear() {
    this.state = {};
  }
}

export default {
  i18n: {
    getMessage: () => {},
  },
  runtime: {
    id: ID,
    getManifest: async () => readFile({ path: '../../src/extension/manifest.json' }).then((mf) => JSON.parse(mf)),
    getURL: (path) => `/test/wtr/fixtures/${path}`,
    lastError: null,
    sendMessage: () => {},
    onMessage: {
      // simulate internal message from tab
      addListener: (func) => func(
        { proxyUrl: document.head.querySelector('meta[property="hlx:proxyUrl"]')?.content },
        { tab: TABS[3] },
      ),
      removeListener: () => {},
    },
    onMessageExternal: {
      // simulate external message from admin API with authToken
      addListener: (func) => func({ owner: 'test', repo: 'auth-project', authToken: 'foo' }),
      removeListener: () => {},
    },
  },
  storage: {
    sync: new StorageMock({
      hlxSidekickProjects: ['adobe/blog'],
      'adobe/blog': {
        giturl: 'https://github.com/adobe/blog',
        owner: 'adobe',
        repo: 'blog',
        ref: 'main',
      },
    }),
    local: new StorageMock({
      hlxSidekickDisplay: true,
      test: 'test',
    }),
    session: new StorageMock({
      hlxSidekickUrlCache: [],
    }),
  },
  declarativeNetRequest: {
    getSessionRules: async () => ([]),
    updateSessionRules: async () => undefined,
  },
  tabs: {
    create: async ({ url }) => ({ url, id: 7 }),
    get: async (id) => (id ? TABS[id] : {}),
    sendMessage: async () => {},
    remove: async () => {},
  },
  scripting: {
    executeScript: ({ func }) => {
      if (typeof func === 'function') {
        func();
      }
    },
  },
};
