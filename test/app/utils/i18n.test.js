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

import sinon from 'sinon';
import { expect } from '@open-wc/testing';
import {
  LANGS, i18n, getLanguage, languagesService, getTimeAgo,
} from '../../../src/extension/app/utils/i18n.js';

describe('i18n', () => {
  describe('i18n', () => {
    const languageDict = {
      greeting: 'Hello',
      farewell: 'Goodbye',
    };

    it('returns the correct string for a valid key', () => {
      expect(i18n(languageDict, 'greeting')).to.equal('Hello');
    });

    it('returns an empty string for a missing key', () => {
      expect(i18n(languageDict, 'notakey')).to.equal('');
    });

    it('returns an empty string for an empty dictionary', () => {
      expect(i18n({}, 'greeting')).to.equal('');
    });

    it('returns an empty string for a null dictionary', () => {
      expect(i18n(null, 'greeting')).to.equal('');
    });

    it('returns an empty string for an undefined dictionary', () => {
      expect(i18n(undefined, 'greeting')).to.equal('');
    });
  });

  describe('getLanguage', () => {
    it('returns the exact match language', () => {
      const stub = sinon.stub(languagesService, 'getNavigatorLanguages').returns(['de', 'en']);
      expect(getLanguage()).to.equal('de');
      stub.restore();
    });

    it('returns the language with matching prefix', () => {
      const stub = sinon.stub(languagesService, 'getNavigatorLanguages').returns(['de-CH', 'en-US']);
      expect(getLanguage()).to.equal('de');
      stub.restore();
    });

    it('returns the default language if no match is found', () => {
      const stub = sinon.stub(languagesService, 'getNavigatorLanguages').returns(['nl', 'sv']);
      expect(getLanguage()).to.equal(LANGS[0]);
      stub.restore();
    });

    it('returns the default language if navigator.languages is empty', () => {
      const stub = sinon.stub(languagesService, 'getNavigatorLanguages').returns([]);
      expect(getLanguage()).to.equal(LANGS[0]);
      stub.restore();
    });
  });

  describe('getTimeAgo', () => {
    const languageDict = {
      now: 'Just now',
      never: 'Never',
      seconds_ago: '$1 seconds ago',
      minutes_ago: '$1 minutes ago',
      today_at: 'Today at $1',
      yesterday_at: 'Yesterday at $1',
      // ... other translations
    };

    afterEach(() => {
      sinon.restore(); // Restore all fakes
    });

    it('should return "Never" for null or undefined date', () => {
      expect(getTimeAgo(languageDict, null)).to.equal('Never');
      expect(getTimeAgo(languageDict, undefined)).to.equal('Never');
    });

    it('should return "Just now" for dates less than 30 seconds ago', () => {
      const date = new Date(Date.now() - 10 * 1000); // 10 seconds ago
      expect(getTimeAgo(languageDict, date)).to.equal('Just now');
    });

    it('should return seconds ago for dates less than 2 minutes ago', () => {
      const date = new Date(Date.now() - 70 * 1000); // 70 seconds ago
      expect(getTimeAgo(languageDict, date)).to.equal('70 seconds ago');
    });

    it('should return minutes ago for dates less than an hour ago', () => {
      const date = new Date(Date.now() - 35 * 60 * 1000); // 35 minutes ago
      expect(getTimeAgo(languageDict, date)).to.equal('35 minutes ago');
    });

    it('should handle "today" dates correctly', () => {
      const now = new Date('2024-03-10T12:00:00Z').getTime();
      const date = new Date(now - 2 * 60 * 60 * 1000); // 2 hours ago
      const expectedTime = date.toLocaleTimeString([], { timeStyle: 'short' });
      expect(getTimeAgo(languageDict, date)).to.equal(`Today at ${expectedTime}`);
    });

    it('should handle "yesterday" dates correctly', () => {
      // Set the clock to a specific time for this test only
      const clock = sinon.useFakeTimers(new Date(2024, 0, 24, 12, 0, 0).getTime());

      const yesterday = new Date(2024, 0, 23, 12, 0, 0);
      const expectedTime = yesterday.toLocaleTimeString([], { timeStyle: 'short' });

      expect(getTimeAgo(languageDict, yesterday)).to.equal(`Yesterday at ${expectedTime}`);

      clock.restore(); // Restore the clock after this test
    });

    it('should handle dates within this year but not today or yesterday', () => {
      const earlierThisYear = new Date(new Date().getFullYear(), 0, 1); // January 1st of this year
      const expectedDate = earlierThisYear.toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
      });

      expect(getTimeAgo(languageDict, earlierThisYear)).to.equal(expectedDate);
    });

    it('should handle dates from a different year', () => {
      const lastYear = new Date(new Date().getFullYear() - 1, 0, 1); // January 1st of last year
      const expectedDate = lastYear.toLocaleString([], {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
      });

      expect(getTimeAgo(languageDict, lastYear)).to.equal(expectedDate);
    });
  });
});
