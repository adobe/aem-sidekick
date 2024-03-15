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
import { fromRollup } from '@web/dev-server-rollup';
import rollupBabel from '@rollup/plugin-babel';

// @ts-ignore
const babel = fromRollup(rollupBabel);

export default {
  nodeResolve: true,
  port: 2000,
  coverage: true,
  coverageConfig: {
    include: ['./src/**/*'],
    report: true,
    reportDir: 'coverage-wtr',
  },
  plugins: [
    babel({
      include: ['src/**/*.js'],
      babelHelpers: 'bundled',
      plugins: ['babel-plugin-istanbul'],
      sourceMaps: 'inline',
    }),
  ],
  testRunnerHtml: (testFramework) => `
  <html>
    <body>
      <script>window.process = { env: { NODE_ENV: "development" } }</script>
      <script type="module" src="${testFramework}"></script>
    </body>
  </html>`,
};
