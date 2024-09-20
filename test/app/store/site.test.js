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
/* eslint-disable no-unused-expressions, no-import-assign, import/no-extraneous-dependencies */

import { expect } from '@open-wc/testing';
import { AppStore } from '../../../src/extension/app/store/app.js';
import chromeMock from '../../mocks/chrome.js';
import { SidekickTest } from '../../sidekick-test.js';
import { defaultSidekickConfig } from '../../fixtures/sidekick-config.js';

// @ts-ignore
window.chrome = chromeMock;

/**
 * The plugins
 * @typedef {import('@Types').SidekickOptionsConfig} SidekickOptionsConfig
 */

/**
 * The plugins
 * @typedef {import('@Types').ClientConfig} ClientConfig
 */

/**
 * The plugins
 * @typedef {import('@Types').SidekickConfig} SidekickConfig
 */

/**
 * The AEMSidekick object type
 * @typedef {import('../../../src/extension/app/aem-sidekick.js').AEMSidekick} AEMSidekick
 */

describe('Test Site Store', () => {
  /**
   * @type {SidekickOptionsConfig}
   */
  // @ts-ignore
  const defaultConfig = {
    owner: 'adobe',
    ref: 'main',
    repo: 'aem-boilerplate',
    giturl: 'https://github.com/adobe/aem-boilerplate',
    mountpoints: ['https://drive.google.com/drive/folders/folder-id'],
  };

  describe('loadContext', () => {
  /**
   * @type {SidekickTest}
   */
    let sidekickTest;

    /**
   * @type {AEMSidekick}
   */
    let sidekickElement;

    /**
   * @type {AppStore}
   */
    let appStore;

    beforeEach(() => {
      appStore = new AppStore();
      sidekickTest = new SidekickTest(defaultSidekickConfig, appStore);

      sidekickTest
        .mockFetchStatusSuccess()
        .mockFetchSidekickConfigNotFound();

      // @ts-ignore
      sidekickElement = document.createElement('div');
    });

    afterEach(() => {
      sidekickTest.destroy();
    });

    it('minimum config', async () => {
      await appStore.loadContext(sidekickElement, defaultConfig);

      expect(appStore.siteStore.project).to.equal('');
      expect(appStore.siteStore.owner).to.equal('adobe');
      expect(appStore.siteStore.ref).to.equal('main');
      expect(appStore.siteStore.repo).to.equal('aem-boilerplate');
      expect(appStore.siteStore.giturl).to.equal('https://github.com/adobe/aem-boilerplate');
      expect(appStore.siteStore.mountpoint).to.equal('https://drive.google.com/drive/folders/folder-id');
      expect(appStore.siteStore.mountpoints.length).to.equal(1);
      expect(appStore.siteStore.mountpoints[0]).to.equal('https://drive.google.com/drive/folders/folder-id');
      expect(appStore.siteStore.innerHost).to.equal('main--aem-boilerplate--adobe.hlx.page');
      expect(appStore.siteStore.stdInnerHost).to.equal('main--aem-boilerplate--adobe.hlx.page');
      expect(appStore.siteStore.stdOuterHost).to.equal('main--aem-boilerplate--adobe.hlx.live');
      expect(appStore.siteStore.outerHost).to.equal('main--aem-boilerplate--adobe.hlx.live');
      expect(appStore.siteStore.lang).to.equal('en');
      expect(appStore.siteStore.devUrl.origin).to.equal('http://localhost:3000');
      expect(appStore.siteStore.views.length).to.equal(1);
      expect(appStore.siteStore.views[0].path).to.equal('**.json');
      expect(appStore.siteStore.views[0].viewer).to.equal('/test/fixtures/views/json/json.html');
      expect(appStore.siteStore.plugins.length).to.equal(0);
    });

    it('hlx 5', async () => {
      const config = {
        ...defaultConfig,
        previewHost: 'main--aem-boilerplate--adobe.aem.page',
      };
      await appStore.loadContext(sidekickElement, config);
      expect(appStore.siteStore.innerHost).to.equal('main--aem-boilerplate--adobe.aem.page');
      expect(appStore.siteStore.stdInnerHost).to.equal('main--aem-boilerplate--adobe.aem.page');
      expect(appStore.siteStore.stdOuterHost).to.equal('main--aem-boilerplate--adobe.aem.live');
      expect(appStore.siteStore.outerHost).to.equal('main--aem-boilerplate--adobe.aem.live');
    });

    it('special views ', async () => {
      /**
       * @type {SidekickOptionsConfig | ClientConfig}
       */
      const config = {
        ...defaultConfig,
        specialViews: [
          {
            path: '**.ext',
            viewer: '/tools/sidekick/example/index.html',
            title: 'JSON',
          },
        ],
      };

      // @ts-ignore
      await appStore.loadContext(sidekickElement, config);
      expect(appStore.siteStore.views.length).to.equal(2);
      expect(appStore.siteStore.views[0].path).to.equal('**.ext');
      expect(appStore.siteStore.views[0].viewer).to.equal('/tools/sidekick/example/index.html');

      expect(appStore.siteStore.views[1].path).to.equal('**.json');
      expect(appStore.siteStore.views[1].viewer).to.equal('/test/fixtures/views/json/json.html');
      // @ts-ignore
      expect(appStore.siteStore.views[1].title()).to.equal('Data rendition');
    });

    it('using ClientConfig (config.json)', async () => {
      sidekickTest
        .mockFetchSidekickConfigSuccess(true, true);

      await appStore.loadContext(sidekickElement, defaultConfig);
      expect(appStore.siteStore.project).to.equal('AEM Boilerplate');
      expect(appStore.siteStore.innerHost).to.equal('custom-preview-host.com');
      expect(appStore.siteStore.liveHost).to.equal('custom-live-host.com');
      expect(appStore.siteStore.host).to.equal('www.aemboilerplate.com');

      expect(appStore.siteStore.plugins.length).to.equal(9);
      const firstPlugin = appStore.siteStore.plugins[0];
      expect(firstPlugin).to.deep.equal({
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
      });
    });

    it('auth enabled and not logged in (401 on config.json)', async () => {
      sidekickTest
        .mockFetchSidekickConfigUnAuthorized();

      await appStore.loadContext(sidekickElement, defaultConfig);
      expect(appStore.siteStore.authorized).to.equal(false);
    });

    it('with window.hlx.sidekickConfig', async () => {
      window.hlx = {};
      window.hlx.sidekickConfig = {
        owner: 'adobe',
        repo: 'aem-boilerplate',
        ref: 'main',
      };
      await appStore.loadContext(sidekickElement, undefined);
      expect(appStore.siteStore.owner).to.equal('adobe');
      expect(appStore.siteStore.repo).to.equal('aem-boilerplate');
    });
  });
});
