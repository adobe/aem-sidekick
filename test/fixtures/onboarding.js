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

export const defaultOnboardingResponse = {
  total: 6,
  offset: 0,
  limit: 6,
  data: [{
    path: '/sidekick/onboarding/en/overview',
    title: 'Overview',
    index: '0',
    action: '',
    category: 'onboarding',
    publicationDate: '',
    lastModified: '1724342331',
    locale: 'en',
  }, {
    path: '/sidekick/onboarding/en/switch-environments',
    title: 'Switch environments',
    index: '1',
    action: '',
    category: 'onboarding',
    publicationDate: '',
    lastModified: '1724341128',
    locale: 'en',
  }, {
    path: '/sidekick/onboarding/en/actions-organization',
    title: 'New organization for actions',
    index: '2',
    action: '',
    category: 'onboarding',
    publicationDate: '',
    lastModified: '1724340936',
    locale: 'en',
  }, {
    path: '/sidekick/onboarding/en/import-projects',
    title: 'Import your projects',
    index: '3',
    action: 'import',
    category: 'onboarding',
    publicationDate: '',
    lastModified: '1727376655',
    locale: 'en',
  }, {
    path: '/sidekick/onboarding/en/join-our-community',
    title: 'Join our community',
    index: '4',
    action: 'join_discord',
    category: 'onboarding',
    publicationDate: '',
    lastModified: '1727446306',
    locale: 'en',
  }, {
    path: '/sidekick/something-else',
    title: 'Should not show up',
    index: '0',
    action: '',
    category: 'something',
    publicationDate: '',
    lastModified: '1727446306',
    locale: 'en',
  }],
  ':type': 'sheet',
};

export const onboardingHtml = () => `
  <div>
    <p>
      <picture>
        <source type="image/webp" srcset="./media_123a8c44e9f4d3cbb1e00fe25a8647303853e8c88.png?width=2000&#x26;format=webply&#x26;optimize=medium" media="(min-width: 600px)">
        <source type="image/webp" srcset="./media_123a8c44e9f4d3cbb1e00fe25a8647303853e8c88.png?width=750&#x26;format=webply&#x26;optimize=medium">
        <source type="image/png" srcset="./media_123a8c44e9f4d3cbb1e00fe25a8647303853e8c88.png?width=2000&#x26;format=png&#x26;optimize=medium" media="(min-width: 600px)">
        <img loading="lazy" alt="" src="./media_123a8c44e9f4d3cbb1e00fe25a8647303853e8c88.png?width=750&#x26;format=png&#x26;optimize=medium" width="800" height="600">
      </picture>
      <br>
      <picture>
        <source type="image/webp" srcset="./media_15af529bf28bde49d92e73a77fe799a5f4a0e3397.png?width=2000&#x26;format=webply&#x26;optimize=medium" media="(min-width: 600px)">
        <source type="image/webp" srcset="./media_15af529bf28bde49d92e73a77fe799a5f4a0e3397.png?width=750&#x26;format=webply&#x26;optimize=medium">
        <source type="image/png" srcset="./media_15af529bf28bde49d92e73a77fe799a5f4a0e3397.png?width=2000&#x26;format=png&#x26;optimize=medium" media="(min-width: 600px)">
        <img loading="lazy" alt="" src="./media_15af529bf28bde49d92e73a77fe799a5f4a0e3397.png?width=750&#x26;format=png&#x26;optimize=medium" width="800" height="609">
      </picture>
    </p>
  </div>
  <div>
    <h1 id="overview">Overview</h1>
    <p>Introducing the redesigned Sidekick</p>
  </div>
`;
