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
 * @typedef {import('@Types').SidekickConfig} SidekickConfig
 */

/**
 * Supported sidekick languages.
 * @private
 * @type {string[]}
 */
export const LANGS = [
  'en', // default language, do not reorder
  'de',
  'es',
  'fr',
  'it',
  'ja',
  'ko',
  'pt_BR',
  'zh_CN',
  'zh_TW',
];

/**
 * Retrieves a string from the dictionary in the user's language.
 * @private
 * @param {Object} languageDict The language dictionary
 * @param {string} key The dictionary key
 * @returns {string} The string in the user's language
 */
export function i18n(languageDict, key) {
  return languageDict ? (languageDict[key] || '') : '';
}

export function getLanguage() {
  for (const navLang of navigator.languages) {
    const prefLang = navLang.replace('-', '_');
    const exactMatch = LANGS.includes(prefLang);
    if (exactMatch) {
      return prefLang;
    } else {
      const prefLangPrefix = prefLang.split('_')[0];
      const prefixMatch = LANGS.find((lang) => lang.startsWith(prefLangPrefix));
      if (prefixMatch) {
        return prefixMatch;
      }
    }
  }
  // fallback to default
  return LANGS[0];
}

/**
 * Fetches the dictionary for a language.
 * @private
 * @param {SidekickConfig} sidekickConfig The site config
 * @param {string} [lang] The language
 * @returns {Promise<object>} The dictionary
 */
export async function fetchLanguageDict(sidekickConfig, lang) {
  const dict = {};
  const dictPath = `${sidekickConfig.scriptRoot}/_locales/${lang || sidekickConfig.lang}/messages.json`;
  try {
    const res = await fetch(dictPath);
    const messages = await res.json();
    Object.keys(messages).forEach((key) => {
      dict[key] = messages[key].message;
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(`failed to fetch dictionary from ${dictPath}`);
  }
  return dict;
}
