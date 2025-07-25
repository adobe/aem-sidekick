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

const ID = 'dummy';

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
  action: {
    setIcon: () => {},
  },
  i18n: {
    getMessage: (key, ...vars) => `i18n?${key}${vars[0] ? `|${vars.join(':')}` : ''}`,
  },
  runtime: {
    id: ID,
    getManifest: () => ({ version: '0.0.0' }),
    getURL: (path) => `/test/fixtures/${path}`.replace('//', '/'),
    lastError: null,
    sendMessage: () => {},
    onMessage: {
      addListener: () => {},
      removeListener: () => {},
    },
    onMessageExternal: {
      addListener: () => {},
      removeListener: () => {},
    },
  },
  storage: {
    sync: new StorageMock(),
    local: new StorageMock(),
    session: new StorageMock(),
  },
  declarativeNetRequest: {
    getDynamicRules: async () => ([{ id: 1 }, { id: 2 }]),
    getSessionRules: async () => ([]),
    updateDynamicRules: async () => undefined,
    updateSessionRules: async () => undefined,
  },
  tabs: {
    create: async ({ url }) => ({ url, id: 7 }),
    get: async () => {},
    query: async () => [{ id: 0 }],
    sendMessage: async () => {},
    remove: async () => {},
    reload: async () => {},
    update: async () => {},
  },
  scripting: {
    executeScript: async ({ func, args = [] }) => {
      if (typeof func === 'function') {
        return func(...args);
      }
      return null;
    },
  },
  contextMenus: {
    create: () => {},
    removeAll: () => {},
    onClicked: {
      addListener: () => {},
    },
  },
  windows: {
    create: async ({ url }) => ({ url, id: 11 }),
  },
  notifications: {
    create: () => {},
    clear: () => {},
  },
};
