/*
 * Copyright 2022 Adobe. All rights reserved.
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
import { rollupAdapter } from '@web/dev-server-rollup';
import rollupBabel from '@rollup/plugin-babel';

// @rollup/plugin-babel v7 uses object-style hooks ({ filter, handler }) which
// @web/dev-server-rollup@0.6 does not support — unwrap them to plain functions.
function fromRollupCompat(rollupPluginFn) {
  return (...args) => {
    const plugin = rollupPluginFn(...args);
    for (const hook of ['transform', 'load', 'resolveId']) {
      if (plugin[hook] && typeof plugin[hook] === 'object' && plugin[hook].handler) {
        plugin[hook] = plugin[hook].handler;
      }
    }
    return rollupAdapter(plugin);
  };
}

// @ts-ignore
const babel = fromRollupCompat(rollupBabel);

export default {
  nodeResolve: true,
  port: 2000,
  coverage: true,
  coverageConfig: {
    include: ['./src/**/*'],
    report: true,
    reportDir: 'coverage-wtr',
    reporters: [
      'lcov',
      'text',
      'text-summary',
    ],
    skipFull: true,
    threshold: {
      statements: 99,
      branches: 97,
      lines: 99,
    },
  },
  plugins: [
    babel({
      include: ['src/**/*.js'],
      babelHelpers: 'bundled',
      plugins: ['babel-plugin-istanbul'],
      sourceMaps: 'inline',
    }),
  ],
  browserLogs: process.env.DEBUG === 'true', // export DEBUG=true to enable browser logs
  testRunnerHtml: (testFramework) => `
  <html>
    <body>
      <script>window.process = { env: { NODE_ENV: "development" } }</script>
      <script type="module" src="${testFramework}"></script>
    </body>
  </html>`,
};
