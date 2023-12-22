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
  LANGS, i18n, getLanguage, languagesService,
} from '../../../../src/extension/app/utils/i18n.js';

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
});
