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
// @ts-nocheck

/* eslint-disable import/no-extraneous-dependencies */

import nodeResolve from '@rollup/plugin-node-resolve';
import { importMetaAssets } from '@web/rollup-plugin-import-meta-assets';
import esbuild from 'rollup-plugin-esbuild';
import copy from 'rollup-plugin-copy';
import replace from '@rollup/plugin-replace';
import { babel } from '@rollup/plugin-babel';
import sidekickManifestBuildPlugin from './build/build.js';

function shared(browser, path = '') {
  return {
    output: {
      entryFileNames: '[name].js',
      chunkFileNames: '[name].js',
      assetFileNames: '[name][extname]',
      exports: 'named',
      format: 'es',
      dir: `dist/${browser}${path}`,
      sourcemap: true,
    },

    preserveEntrySignatures: true,
  };
}

function commonPlugins() {
  return [
    /** Resolve bare module imports */
    nodeResolve(),
    /** Transform decorators with babel */
    babel({ babelHelpers: 'bundled' }),
    /** Minify JS, compile JS to a lower language target */
    esbuild({
      minify: true,
      target: ['chrome64'],
    }),
    replace({
      'process.env.NODE_ENV': JSON.stringify('production'),
    }),
  ];
}

function extensionPlugins(browser) {
  return [
    /** Bundle assets references via import.meta.url */
    importMetaAssets(),
    /** Copy static assets */
    copy({
      targets: [
        { src: 'src/extension/*', ignore: ['src/extension/app', 'src/extension/views', 'src/extension/types'], dest: `./dist/${browser}` },
        { src: 'src/extension/views/json/json.html', dest: `./dist/${browser}/views/json` },
        { src: 'src/extension/views/login/login.html', dest: `./dist/${browser}/views/login` },
        { src: 'src/extension/views/doc-source', dest: `./dist/${browser}/views/` },
      ],
    }),
    sidekickManifestBuildPlugin(browser),
  ];
}

function rewriteSPTagNames() {
  return {
    name: 'rename-sp-custom-elements',
    generateBundle(_, bundle) {
      for (const [_, file] of Object.entries(bundle)) {
        if (file.type === 'chunk') {
          file.code = file.code.replaceAll('sp-theme', 'sk-theme');
          file.code = file.code.replaceAll('sp-overlay', 'sk-overlay');
          file.code = file.code.replaceAll('sp-action-menu', 'sk-action-menu');
          file.code = file.code.replaceAll('sp-action-button', 'sk-action-button');
        }
      }
    },
  };
}

function extensionBuild(browser) {
  return {
    ...shared(browser),
    plugins: [
      ...commonPlugins(),
      ...extensionPlugins(browser),
      rewriteSPTagNames(),
    ],
  };
}

export function viewBuild(browser, path) {
  return {
    ...shared(browser, path),
    plugins: [
      ...commonPlugins(),
      rewriteSPTagNames(),
    ],
  };
}

export function createExtension(browser) {
  return [
    {
      input: 'src/extension/index.js',
      ...extensionBuild(browser),
    },
  ];
}

export default [
  {
    input: 'src/extension/views/json/json.js',
    ...viewBuild('chrome', '/views/json'),
  },
  {
    input: 'src/extension/views/login/login.js',
    ...viewBuild('chrome', '/views/login'),
  },
  ...createExtension('chrome'),
];
