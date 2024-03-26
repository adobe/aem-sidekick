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
};

export const defaultConfigJSONWithHost = {
  ...defaultConfigJSON,
  previewHost: 'custom-preview-host.com',
  liveHost: 'custom-live-host.com',
  host: 'custom-host.com',
};

export const defaultConfigJSONWithPlugins = {
  ...defaultConfigJSONWithHost,
  plugins: [
    {
      id: 'asset-library',
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
      environments: ['dev', 'preview', 'live'],
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
      url: 'https://main--aem-boilerplate--adobe.hlx.page/tools/loc',
      isPalette: true,
    },
  ],
};

export const defaultConfigJSONWithUnpinnedPlugin = {
  ...defaultConfigJSONWithHost,
  plugins: [
    {
      title: 'Pin me',
      pinned: false,
      event: 'foo',
      excludePaths: ['/**'],
      includePaths: ['**/HelixProjects/**'],
    },
  ],
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
  edit: {
    url: 'https://adobe-my.sharepoint.com/:w:/r/personal/user_adobe_com/_layouts/15/Doc.aspx?sourcedoc={89B9F732-7067-458B-BF05-C64013503F33}',
    name: 'index',
    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    lastModified: 'Wed, 29 Dec 2023 17:22:52 GMT',
    sourceLocation: 'onedrive:/drives/drive-id/items/item-id',
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
  edit: {
    url: 'https://adobe-my.sharepoint.com/:w:/r/personal/user_adobe_com/_layouts/15/Doc.aspx?sourcedoc={89B9F732-7067-458B-BF05-C64013503F33}',
    name: 'index',
    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    lastModified: 'Wed, 29 Dec 2023 17:22:52 GMT',
    sourceLocation: 'onedrive:/drives/drive-id/items/item-id',
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
    status: 'https://admin.hlx.page/status/adobe/aem-boilerplate/main/placeholders.json',
    preview: 'https://admin.hlx.page/preview/adobe/aem-boilerplate/main/placeholders.json',
    live: 'https://admin.hlx.page/live/adobe/aem-boilerplate/main/placeholders.json',
    code: 'https://admin.hlx.page/code/adobe/aem-boilerplate/main/placeholders.json',
  },
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
  edit: {
    url: 'https://docs.google.com/document/d/doc-id/edit',
    name: 'index',
    contentType: 'application/vnd.google-apps.document',
    folders: [
      {
        name: '',
        url: 'https://drive.google.com/drive/u/0/folders/folder-id',
        path: '/',
      },
    ],
    lastModified: 'Wed, 29 Dec 2023 17:22:52 GMT',
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

export const defaultStatusResponseWithProfile = {
  ...defaultGdriveStatusResponse,
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
