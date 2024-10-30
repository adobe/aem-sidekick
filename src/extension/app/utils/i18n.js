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
 * @typedef {import('../store/site.js').SiteStore} SiteStore
 */

/**
 * Wraps the navigator.languages API.
 * Used for testing.
 */
export const languagesService = {
  getNavigatorLanguages: () => navigator.languages,
  // other location-related methods...
};

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
  for (const navLang of languagesService.getNavigatorLanguages()) {
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
 * @param {SiteStore} siteStore The site config
 * @param {string} [lang] The language
 * @returns {Promise<object>} The dictionary
 */
export async function fetchLanguageDict(siteStore, lang) {
  const dict = {};
  const dictPath = chrome.runtime.getURL(`_locales/${lang || siteStore.lang}/messages.json`);
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

/**
 * Generates a localized time-ago string based on the given date
 * @param {Object} languageDict The language dictionary
 * @param {(Date|string)} dateParam The date from which to calculate the time-ago
 * @returns A localized time-ago string
 */
export function getTimeAgo(languageDict, dateParam) {
  if (!dateParam) {
    return i18n(languageDict, 'never');
  }
  const date = typeof dateParam === 'object' ? dateParam : new Date(dateParam);

  const today = new Date();
  const yesterday = new Date(today.getTime() - 86400000); // 86400000 = ms in a day
  const seconds = Math.round((today.getTime() - date.getTime()) / 1000);
  const minutes = Math.round(seconds / 60);
  const isToday = today.toDateString() === date.toDateString();
  const isYesterday = yesterday.toDateString() === date.toDateString();
  const isThisYear = today.getFullYear() === date.getFullYear();
  const timeToday = date.toLocaleTimeString([], {
    timeStyle: 'short',
  });
  const dateThisYear = date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  });
  const fullDate = date.toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  });

  if (seconds < 30) {
    return i18n(languageDict, 'now');
  } else if (seconds < 120) {
    return i18n(languageDict, 'seconds_ago').replace('$1', seconds.toString());
  } else if (minutes < 60) {
    return i18n(languageDict, 'minutes_ago').replace('$1', minutes.toString());
  } else if (isToday) {
    return i18n(languageDict, 'today_at').replace('$1', timeToday);
  } else if (isYesterday) {
    return i18n(languageDict, 'yesterday_at').replace('$1', timeToday);
  } else if (isThisYear) {
    return dateThisYear;
  }

  return fullDate;
}
