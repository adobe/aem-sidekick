/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { FlatCompat } from '@eslint/eslintrc';
import { recommended as helix } from '@adobe/eslint-config-helix';

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

export default [
  {
    ignores: [
      '.vscode/*',
      'coverage/*',
      'debug/*',
      'dist/*',
      'src/extension/lib/*.js',
      'src/lib/*',
      '.releaserc.cjs',
    ],
  },
  ...compat.extends('@open-wc/eslint-config', 'plugin:mobx/recommended'),
  {
    // `import` is already provided by @open-wc/eslint-config; only pull in
    // the `header` plugin from the helix config to avoid redefining it.
    ...helix,
    plugins: { header: helix.plugins.header },
  },
  {
    languageOptions: {
      parserOptions: {
        allowImportExportEverywhere: true,
        sourceType: 'module',
        requireConfigFile: false,
        ecmaVersion: 2022,
      },
      globals: {
        // required for extension
        chrome: 'writable',
        jsyaml: 'writable',
      },
    },
    rules: {
      // allow reassigning param
      'no-param-reassign': 0,
      'import/extensions': ['error', {
        js: 'always',
        json: 'always',
      }],
      'import/prefer-default-export': 0,
      'class-methods-use-this': 0,
      'mobx/missing-make-observable': 0,
      'wc/guard-super-call': 0,
      indent: ['error', 2, { ignoredNodes: ['TemplateLiteral *'], SwitchCase: 1 }],
      'function-paren-newline': 'off',
      'lit/no-classfield-shadowing': 'off',
      'no-undef': 'off',
    },
  },
];
