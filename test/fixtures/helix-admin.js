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

/**
 * config.json stubs
 */

export const defaultConfigJSON = {
  project: 'AEM Boilerplate',
  contentSourceUrl: 'https://drive.google.com/drive/u/0/folders/1MGzOt7ubUh3gu7zhZIPb7R7dyRzG371j',
  contentSourceType: 'google',
};

export const defaultConfigJSONWithHost = {
  ...defaultConfigJSON,
  previewHost: 'custom-preview-host.com',
  liveHost: 'custom-live-host.com',
  host: 'custom-host.com',
};

export const defaultConfigPlugins = {
  plugins: [
    {
      id: 'assets',
      environments: [
        'edit',
      ],
      url: 'https://test.adobe.com/asset-selector.html',
      isPalette: true,
      includePaths: [
        '**.docx**',
      ],
      paletteRect: 'top: 50px;',
    },
    {
      id: 'library',
      title: 'Library',
      environments: ['edit'],
      url: 'https://main--aem-boilerplate--adobe.hlx.live/tools/sidekick/library.html',
      includePaths: ['**.docx**'],
      passConfig: true,
      passReferrer: true,
    },
    {
      id: 'tools',
      title: 'Tools',
      isContainer: true,
    },
    {
      containerId: 'tools',
      title: 'Tag Selector',
      id: 'tag-selector',
      environments: ['edit'],
      url: 'https://main--aem-boilerplate--adobe.hlx.live/tools/tagger',
      isPalette: true,
      paletteRect: 'top: 150px; left: 7%; height: 675px; width: 85vw;',
    },
    {
      containerId: 'tools',
      title: 'Check Schema',
      id: 'checkschema',
      environments: ['prod'],
      event: 'check-schema',
      excludePaths: ['/tools**', '*.json'],
    },
    {
      containerId: 'tools',
      title: 'Preflight',
      id: 'preflight',
      environments: ['edit', 'dev', 'preview', 'live'],
      event: 'preflight',
    },
    {
      containerId: 'tools',
      id: 'predicted-url',
      title: 'Predicted URL',
      environments: ['dev', 'preview'],
      event: 'predicted-url',
      excludePaths: ['/**'],
      includePaths: ['**/drafts/**'],
    },
    {
      containerId: 'tools',
      id: 'localize',
      titleI18n: {
        en: 'Localize project',
      },
      environments: ['edit'],
      url: '/tools/loc',
      isPalette: true,
    },
    {
      // override core plugin
      id: 'publish',
      excludePaths: ['**/drafts/**'],
    },
  ],
};

export const defaultConfigUnpinnedPlugin = {
  ...defaultConfigJSON,
  plugins: [
    {
      title: 'Unpinned Plugin',
      pinned: false,
      url: '/tools/foo.html',
    },
  ],
};

export const defaultConfigUnpinnedContainerPlugin = {
  ...defaultConfigJSON,
  plugins: [
    {
      id: 'tools',
      title: 'tools',
      pinned: false,
      isContainer: true,
    },
    {
      id: 'tool',
      title: 'Tool',
      containerId: 'tools',
      event: 'tool',
    },
  ],
};

export const defaultEnvJSON = {
  version: 1,
  prod: {
    host: 'foo.bar',
    routes: [],
  },
  contentSourceUrl: 'https://adobe.sharepoint.com/sites/foo/Shared%20Documents/root',
  contentSourceType: 'onedrive',
};

/**
 * status request stubs
 */
export const defaultSharepointStatusResponse = {
  webPath: '/',
  resourcePath: '/index.md',
  live: {
    url: 'https://main--aem-boilerplate--adobe.hlx.live/',
    status: 200,
    contentBusId: 'helix-content-bus/content-bus-id/live/index.md',
    contentType: 'text/plain; charset=utf-8',
    lastModified: 'Tue, 19 Dec 2023 15:42:45 GMT',
    sourceLocation: 'onedrive:/drives/drive-id/items/item-id',
    sourceLastModified: 'Wed, 01 Nov 2023 17:22:52 GMT',
    permissions: [
      'read',
      'write',
    ],
  },
  preview: {
    url: 'https://main--aem-boilerplate--adobe.hlx.page/',
    status: 200,
    contentBusId: 'helix-content-bus/content-bus-id/preview/index.md',
    contentType: 'text/plain; charset=utf-8',
    lastModified: 'Tue, 19 Dec 2023 15:42:34 GMT',
    sourceLocation: 'onedrive:/drives/drive-id/items/item-id',
    sourceLastModified: 'Wed, 01 Nov 2023 17:22:52 GMT',
    permissions: [
      'read',
      'write',
    ],
  },
  edit: {},
  code: {
    status: 400,
    permissions: [
      'delete',
      'read',
      'write',
    ],
  },
  links: {
    status: 'https://admin.hlx.page/status/adobe/aem-boilerplate/main/',
    preview: 'https://admin.hlx.page/preview/adobe/aem-boilerplate/main/',
    live: 'https://admin.hlx.page/live/adobe/aem-boilerplate/main/',
    code: 'https://admin.hlx.page/code/adobe/aem-boilerplate/main/',
  },
};

export const defaultSharepointSheetStatusResponse = {
  webPath: '/placeholders.json',
  resourcePath: '/placeholders.json',
  live: {
    url: 'https://main--aem-boilerplate--adobe.hlx.live/placeholders.json',
    status: 200,
    contentBusId: 'helix-content-bus/content-bus-id/live/placeholders.json',
    contentType: 'text/plain; charset=utf-8',
    lastModified: 'Tue, 19 Dec 2023 15:42:45 GMT',
    sourceLocation: 'onedrive:/drives/drive-id/items/item-id',
    sourceLastModified: 'Wed, 01 Nov 2023 17:22:52 GMT',
    permissions: [
      'read',
      'write',
    ],
  },
  preview: {
    url: 'https://main--aem-boilerplate--adobe.hlx.page/placeholders.json',
    status: 200,
    contentBusId: 'helix-content-bus/content-bus-id/preview/placeholders.json',
    contentType: 'text/plain; charset=utf-8',
    lastModified: 'Tue, 19 Dec 2023 15:42:34 GMT',
    sourceLocation: 'onedrive:/drives/drive-id/items/item-id',
    sourceLastModified: 'Wed, 01 Nov 2023 17:22:52 GMT',
    permissions: [
      'read',
      'write',
    ],
  },
  edit: {},
  code: {
    status: 400,
    permissions: [
      'delete',
      'read',
      'write',
    ],
  },
  links: {
    status: 'https://admin.hlx.page/status/adobe/aem-boilerplate/main/placeholders.json',
    preview: 'https://admin.hlx.page/preview/adobe/aem-boilerplate/main/placeholders.json',
    live: 'https://admin.hlx.page/live/adobe/aem-boilerplate/main/placeholders.json',
    code: 'https://admin.hlx.page/code/adobe/aem-boilerplate/main/placeholders.json',
  },
};

export const defaultSharepointEditInfo = {
  status: 200,
  url: 'https://adobe.sharepoint.com/sites/foo/_layouts/15/Doc.aspx?sourcedoc=%7B207F9725-D73A-4C98-A87D-DC6AD4360373%7D&file=bar.docx&action=default&mobileredirect=true',
  name: 'bar.docx',
  contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  folders: [
    {
      name: 'foo',
      url: 'https://adobe.sharepoint.com/sites/foo/Shared%20Documents/site/foo',
      path: '/foo',
    },
    {
      name: 'site',
      url: 'https://adobe.sharepoint.com/sites/foo/Shared%20Documents/site',
      path: '/',
    },
  ],
  lastModified: 'Fri, 21 Jul 2023 19:58:27 GMT',
  sourceLocation: 'onedrive:/drives/b!SRYzYQL770qsQPbhXU8sWMnBDDbKRg1Npp5iKHaWz7cyd_ev_i2JTI5LB0GcN0hc/items/01HFRI53JFS57SAOWXTBGKQ7O4NLKDMA3T',
};

export const defaultGdriveStatusResponse = {
  webPath: '/',
  resourcePath: '/index.md',
  live: {
    url: 'https://main--aem-boilerplate--adobe.hlx.live/',
    status: 200,
    contentBusId: 'helix-content-bus/content-bus-id/live/index.md',
    contentType: 'text/plain; charset=utf-8',
    lastModified: 'Tue, 19 Dec 2023 15:42:45 GMT',
    sourceLocation: 'gdrive:drive-id',
    sourceLastModified: 'Wed, 01 Nov 2023 17:22:52 GMT',
    permissions: [
      'read',
      'write',
    ],
  },
  preview: {
    url: 'https://main--aem-boilerplate--adobe.hlx.page/',
    status: 200,
    contentBusId: 'helix-content-bus/content-bus-id/preview/index.md',
    contentType: 'text/plain; charset=utf-8',
    lastModified: 'Tue, 19 Dec 2023 15:42:34 GMT',
    sourceLocation: 'gdrive:drive-id',
    sourceLastModified: 'Wed, 01 Nov 2023 17:22:52 GMT',
    permissions: [
      'read',
      'write',
    ],
  },
  edit: {},
  code: {
    status: 400,
    permissions: [
      'delete',
      'read',
      'write',
    ],
  },
  links: {
    status: 'https://admin.hlx.page/status/adobe/aem-boilerplate/main/',
    preview: 'https://admin.hlx.page/preview/adobe/aem-boilerplate/main/',
    live: 'https://admin.hlx.page/live/adobe/aem-boilerplate/main/',
    code: 'https://admin.hlx.page/code/adobe/aem-boilerplate/main/',
  },
};

export const defaultProfileResponse = {
  profile: {
    iss: 'https://accounts.google.com',
    aud: 'user-id.apps.googleusercontent.com',
    sub: '1234',
    hd: 'example.com',
    email: 'foo@example.com',
    email_verified: true,
    name: 'Peter Parker',
    picture: 'https://lh3.googleusercontent.com/a/user-id',
    given_name: 'Peter',
    family_name: 'Parker',
    locale: 'en',
    iat: 111,
    exp: 222,
    ttl: 333,
    hlx_hash: 'J9y9hUNu5vJS9_38ck_POjo2FgQ',
  },
};

export function defaultStatusResponse(contentSource = 'sharepoint', withProfile = false, overrides = {}, editUrl = undefined) {
  const status = (contentSource === 'sharepoint') ? defaultSharepointStatusResponse : defaultGdriveStatusResponse;
  const profile = withProfile ? defaultProfileResponse : {};
  const edit = editUrl ? { edit: defaultSharepointEditInfo } : {};
  if (withProfile) {
    status.preview.permissions.push('delete');
    status.live.permissions.push('delete');
  }
  return {
    ...status,
    ...edit,
    ...profile,
    ...overrides,
  };
}

export const defaultStatusLoggedInNotAuthorizedResponse = {
  webPath: '/',
  resourcePath: '/index.md',
  live: {
    status: 403,
    url: 'https://main--aem-boilerplate--adobe.hlx.live/',
    error: 'forbidden',
  },
  preview: {
    status: 403,
    url: 'https://main--aem-boilerplate--adobe.hlx.page/',
    error: 'forbidden',
  },
  edit: {
    status: 403,
  },
  code: {
    status: 403,
  },
  links: {
    status: 'https://admin.hlx.page/status/adobe/aem-boilerplate/main/',
    preview: 'https://admin.hlx.page/preview/adobe/aem-boilerplate/main/',
    live: 'https://admin.hlx.page/live/adobe/aem-boilerplate/main/',
    code: 'https://admin.hlx.page/code/adobe/aem-boilerplate/main/',
    logout: 'https://admin.hlx.page/logout/adobe/aem-boilerplate/main',
  },
  profile: {
    iss: 'https://accounts.google.com',
    aud: 'user-id.apps.googleusercontent.com',
    sub: '1234',
    hd: 'example.com',
    email: 'foo@example.com',
    email_verified: true,
    name: 'Peter Parker',
    picture: 'https://lh3.googleusercontent.com/a/user-id',
    given_name: 'Peter',
    family_name: 'Parker',
    locale: 'en',
    iat: 111,
    exp: 222,
    ttl: 333,
    hlx_hash: 'J9y9hUNu5vJS9_38ck_POjo2FgQ',
  },
};

export const defaultGdriveProfileResponse = {
  status: 200,
  profile: {
    iss: 'https://accounts.google.com',
    aud: 'user-id.apps.googleusercontent.com',
    sub: 'sub-id',
    hd: 'example.com',
    email: 'foo@example.com',
    email_verified: true,
    name: 'Dylan DePass',
    picture: 'https://lh3.googleusercontent.com/a/ACg8ocLr6H7E_PkxRUeyyalOW2BYgEt7boQk7yzVCrVIm4g4=s96-c',
    given_name: 'Peter',
    family_name: 'Parker',
    locale: 'en',
    iat: 1708100467,
    exp: 1708104067,
    ttl: 3190,
    hlx_hash: 'hash',
  },
  links: {
    logout: 'https://admin.hlx.page/logout/adobe/aem-boilerplate/main',
  },
};

export const defaultSharepointProfileResponse = {
  status: 200,
  profile: {
    aud: 'aud-id',
    iss: 'https://login.microsoftonline.com/fa7b1b5a-7b34-4387-94ae-d2c178decee1/v2.0',
    iat: 1708104155,
    nbf: 1708104155,
    exp: 1708108055,
    email: 'foo@example.com',
    name: 'Peter Parker',
    oid: 'oid-id',
    preferred_username: 'foo@example.com',
    rh: 'rh-id',
    roles: [
      'admin',
    ],
    sub: 'sub-id',
    tid: 'tid-id',
    uti: 'uti-id',
    ver: '2.0',
    ttl: 3349,
    hlx_hash: 'hash',
    picture: 'https://admin.hlx.page/profile/adobe/aem-boilerplate/main/user-id/picture',
  },
  links: {
    logout: 'https://admin.hlx.page/logout/adobe/aem-boilerplate/main',
  },
};

export const defaultDirectorySharepointStatusResponse = {
  webPath: '/',
  resourcePath: '/',
  live: {
    url: 'https://main--aem-boilerplate--adobe.hlx.live/',
    status: 404,
    contentBusId: 'helix-content-bus/content-bus-id/live/',
    permissions: [
      'read',
      'write',
    ],
  },
  preview: {
    url: 'https://main--aem-boilerplate--adobe.hlx.page/',
    status: 404,
    contentBusId: 'helix-content-bus/content-bus-id/preview/',
    permissions: [
      'read',
      'write',
    ],
  },
  edit: {
    url: 'https://adobe-my.sharepoint.com/personal/user_adobe_com/_layouts/15/onedrive.aspx?id=%2Fpersonal%5Fadobe%5Fcom%2FDocuments%2Faem%2Dboilerplate&view=0',
    name: 'aem-boilerplate',
    contentType: 'application/folder',
    folders: [],
    lastModified: 'Mon, 14 Feb 2022 16:39:24 GMT',
    sourceLocation: 'gdrive:drive-id',
    status: 200,
  },
  code: {
    status: 400,
    permissions: [
      'delete',
      'read',
      'write',
    ],
  },
  links: {
    status: 'https://admin.hlx.page/status/adobe/aem-boilerplate/main/',
    preview: 'https://admin.hlx.page/preview/adobe/aem-boilerplate/main/',
    live: 'https://admin.hlx.page/live/adobe/aem-boilerplate/main/',
    code: 'https://admin.hlx.page/code/adobe/aem-boilerplate/main/',
  },
};

export const defaultDirectoryGdriveStatusResponse = {
  webPath: '/',
  resourcePath: '/',
  live: {
    url: 'https://main--aem-boilerplate--adobe.hlx.live/',
    status: 404,
    contentBusId: 'helix-content-bus/content-bus-id/live/',
    permissions: [
      'read',
      'write',
    ],
  },
  preview: {
    url: 'https://main--aem-boilerplate--adobe.hlx.page/',
    status: 404,
    contentBusId: 'helix-content-bus/content-bus-id/preview/',
    permissions: [
      'read',
      'write',
    ],
  },
  edit: {
    url: 'https://drive.google.com/drive/u/1/folders/folder-id',
    name: 'aem-boilerplate',
    contentType: 'application/folder',
    folders: [],
    lastModified: 'Mon, 14 Feb 2022 16:39:24 GMT',
    sourceLocation: 'gdrive:drive-id',
    status: 200,
  },
  code: {
    status: 400,
    permissions: [
      'delete',
      'read',
      'write',
    ],
  },
  links: {
    status: 'https://admin.hlx.page/status/adobe/aem-boilerplate/main/',
    preview: 'https://admin.hlx.page/preview/adobe/aem-boilerplate/main/',
    live: 'https://admin.hlx.page/live/adobe/aem-boilerplate/main/',
    code: 'https://admin.hlx.page/code/adobe/aem-boilerplate/main/',
  },
};

export const defaultStartJobResponse = {
  status: 202,
  job: {
    topic: 'topic',
    name: '123',
    state: 'created',
    startTime: new Date().toUTCString(),
  },
};

export const defaultJobStatusResponse = {
  topic: 'topic',
  name: '123',
  state: 'complete',
  startTime: new Date().toUTCString(),
  progress: {
    total: 10,
    processed: 10,
    failed: 0,
  },
};

export const defaultJobDetailsResponse = {
  ...defaultJobStatusResponse,
  data: {
    resources: [
      {
        status: 200,
        path: '/foo',
      },
      {
        status: 200,
        path: '/bar',
      },
    ],
  },
};
