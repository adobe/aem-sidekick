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
  previewHost: 'https://custom-preview-host.com',
  liveHost: 'https://custom-live-host.com',
  host: 'https://custom-host.com',
};

export const defaultConfigJSONWithPlugins = {
  ...defaultConfigJSON,
  plugins: [
    {
      id: 'asset-library',
      title: 'My Assets',
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
  ],
};

/**
 * status request stubs
 */

export const defaultStatusResponse = {
  webPath: '/',
  resourcePath: '/index.md',
  live: {
    url: 'https://main--aem-boilerplate--adobe.hlx.live/',
    status: 200,
    contentBusId: 'helix-content-bus/context-bus-id/live/index.md',
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
    contentBusId: 'helix-content-bus/context-bus-id/preview/index.md',
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
    lastModified: 'Wed, 01 Nov 2023 17:22:52 GMT',
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

export const statusResponseWithProfile = {
  ...defaultStatusResponse,
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
