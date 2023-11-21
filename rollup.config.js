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

/* eslint-disable import/no-extraneous-dependencies */

import nodeResolve from '@rollup/plugin-node-resolve';
import { importMetaAssets } from '@web/rollup-plugin-import-meta-assets';
import esbuild from 'rollup-plugin-esbuild';
import copy from 'rollup-plugin-copy';
import sidekickManifestBuildPlugin from './build/build.js';

function shared(browser) {
  return {
    output: {
      entryFileNames: '[name].js',
      chunkFileNames: '[name].js',
      assetFileNames: '[name][extname]',
      format: 'es',
      dir: `dist/${browser}`,
    },

    preserveEntrySignatures: false,
  };
}

function plugins(browser) {
  return [
    /** Resolve bare module imports */
    nodeResolve(),
    /** Minify JS, compile JS to a lower language target */
    esbuild({
      minify: true,
      target: ['chrome64', 'firefox67', 'safari11.1'],
    }),
    /** Bundle assets references via import.meta.url */
    importMetaAssets(),
    /** Copy static assets */
    copy({
      targets: [
        { src: 'src/extension/*', ignore: ['src/extension/app'], dest: `./dist/${browser}` },
      ],
    }),
    sidekickManifestBuildPlugin(browser),
  ];
}

function extensionBuild(browser) {
  return {
    watch: {
      include: './src/**',
      clearScreen: true,
    },
    ...shared(browser),
    plugins: [...plugins(browser)],
  };
}

export default [
  {
    input: 'src/extension/index.js',
    ...extensionBuild('chrome'),
  },
  {
    input: 'src/extension/index.js',
    ...extensionBuild('safari'),
  },
];
