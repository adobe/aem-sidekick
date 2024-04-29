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
      target: ['chrome64', 'firefox67', 'safari11.1'],
    }),
    replace({
      'process.env.NODE_ENV': JSON.stringify('production'),
    }),
  ];
}

function extensionPlugins(browser) {
  return [
    /** Resolve bare module imports */
    nodeResolve(),
    /** Transform decorators with babel */
    babel({ babelHelpers: 'bundled' }),
    /** Minify JS, compile JS to a lower language target */
    esbuild({
      minify: true,
      target: ['chrome64', 'firefox67', 'safari11.1'],
    }),
    replace({
      'process.env.NODE_ENV': JSON.stringify('production'),
    }),
    /** Bundle assets references via import.meta.url */
    importMetaAssets(),
    /** Copy static assets */
    copy({
      targets: [
        { src: 'src/extension/options.html', dest: `./dist/${browser}` },
        { src: 'src/extension/icons', dest: `./dist/${browser}` },
        { src: 'src/extension/_locales', dest: `./dist/${browser}` },
      ],
    }),
    replace({
      'process.env.NODE_ENV': JSON.stringify('production'),
    }),
    sidekickManifestBuildPlugin(browser),
  ];
}

function extensionBuild(browser) {
  return {
    ...shared(browser),
    plugins: [...commonPlugins(), ...extensionPlugins(browser)],
  };
}

function viewBuild(browser, path) {
  return {
    ...shared(browser, path),
    plugins: [...commonPlugins()],
  };
}

function createExtension(browser) {
  return [
    {
      input: 'src/extension/index.js',
      ...extensionBuild(browser),
    },
    {
      input: 'src/extension/background.js',
      ...extensionBuild(browser),
    },
    {
      input: 'src/extension/content.js',
      ...extensionBuild(browser),
    },
  ];
}

export default [
  ...createExtension('chrome'),
  ...createExtension('safari'),
  {
    input: 'src/extension/views/json/json.js',
    ...viewBuild('chrome', '/views/json'),
  },
];
