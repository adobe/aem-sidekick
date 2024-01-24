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

/* eslint-disable no-unused-expressions */

import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import {
  getLocation,
  getProjectDetails,
  getResourceURL,
  isSupportedFileExtension,
  matchProjectHost,
  createTag,
  extendTag,
  globToRegExp,
} from '../../../../src/extension/app/utils/browser.js';

describe('browser utils', () => {
  describe('getResourceURL', () => {
    it('should return a new URL based on the path search parameter', () => {
      const testUrl = new URL('http://example.com?path=http://example.org/resource');
      const result = getResourceURL(testUrl);
      expect(result.toString()).to.equal('http://example.org/resource');
    });

    it('should return the original URL if no path parameter is present', () => {
      const testUrl = new URL('http://example.com');
      const result = getResourceURL(testUrl);
      expect(result).to.equal(testUrl);
    });
  });

  describe('getLocation', () => {
    it('should use the value from a valid test location input', () => {
      const input = document.createElement('input');
      input.id = 'sidekick_test_location';
      input.value = 'http://testlocation.com';
      document.body.appendChild(input);

      const result = getLocation();
      expect(result.toString()).to.equal('http://testlocation.com/');

      input.remove();
    });

    it('should return null for an invalid test location URL', () => {
      const input = document.createElement('input');
      input.id = 'sidekick_test_location';
      input.value = 'invalid-url';
      document.body.appendChild(input);

      const result = getLocation();
      expect(result).to.equal(null);

      document.body.removeChild(input);
    });
  });

  describe('getProjectDetails', () => {
    it('returns details for a host with repo and owner, ignoring the ref', () => {
      const host = 'main--aem-boilerplate--adobe.hlx.page';
      const result = getProjectDetails(host);
      expect(result).to.deep.equal(['aem-boilerplate', 'adobe']);
    });

    it('throws an error for a host with less than two parts', () => {
      const host = 'invalidhost';
      expect(() => getProjectDetails(host)).to.throw('not a project host');
    });

    it('no ref', () => {
      const host = 'aem-boilerplate--adobe.hlx.page';
      const result = getProjectDetails(host);
      expect(result).to.deep.equal(['aem-boilerplate', 'adobe']);
    });
  });

  describe('matchProjectHost', () => {
    it('returns false if either host is null or undefined', () => {
      expect(matchProjectHost(null, 'host.example.com')).to.eq(false);
      expect(matchProjectHost('base.example.com', undefined)).to.eq(false);
      expect(matchProjectHost(null, undefined)).to.eq(false);
    });

    it('returns true for identical hosts', () => {
      expect(matchProjectHost('example.com', 'example.com')).to.eq(true);
    });

    it('returns true for matching hosts in preview mode', () => {
      expect(matchProjectHost('main--repo--owner.aem.page', 'main--repo--owner.aem.page')).to.eq(true);
    });

    it('returns true for matching hosts in live mode', () => {
      expect(matchProjectHost('main--repo--owner.aem.live', 'main--repo--owner.aem.live')).to.eq(true);
    });

    it('returns false for hosts with different project details but same suffix', () => {
      expect(matchProjectHost('main--repo1--owner.aem.page', 'main--repo2--owner.aem.page')).to.eq(false);
    });

    it('returns false for hosts with same project details but different suffixes', () => {
      expect(matchProjectHost('main--repo--owner.aem.page', 'main--repo--owner.aem.live')).to.eq(false);
    });

    it('returns false for invalid host formats', () => {
      expect(matchProjectHost('invalidhost', 'repo--owner.aem.page')).to.eq(false);
      expect(matchProjectHost('main--repo--owner.aem.page', 'invalidhost')).to.eq(false);
    });
  });

  describe('isSupportedFileExtension', () => {
    it('returns true for supported file extensions', () => {
      const extensions = ['json', 'jpg', 'jpeg', 'png', 'pdf', 'svg'];
      extensions.forEach((ext) => {
        expect(isSupportedFileExtension(`file.${ext}`)).to.eq(true);
      });
    });

    it('returns false for unsupported file extensions', () => {
      expect(isSupportedFileExtension('file.txt')).to.eq(false);
    });

    it('returns true for paths without an extension', () => {
      expect(isSupportedFileExtension('file')).to.eq(true);
      expect(isSupportedFileExtension('folder/file')).to.eq(true);
    });

    it('handles mixed case extensions correctly', () => {
      expect(isSupportedFileExtension('file.JsOn')).to.eq(true);
      expect(isSupportedFileExtension('image.JPEG')).to.eq(true);
    });

    it('handles edge cases', () => {
      expect(isSupportedFileExtension('')).to.eq(true); // Empty string
      expect(isSupportedFileExtension('file.name.with.multiple.dots.jpg')).to.eq(true); // Multiple periods
    });
  });

  describe('createTag', () => {
    let config;
    let clickListener;

    beforeEach(() => {
      clickListener = sinon.fake();
      config = {
        tag: 'div',
        attrs: { id: 'test-id', class: 'test-class' },
        lstnrs: { click: clickListener },
        text: 'Test Content',
      };
    });

    it('should create an element with the specified tag', () => {
      const element = createTag(config);
      expect(element.tagName.toLowerCase()).to.equal('div');
    });

    it('should apply attributes, listeners, and text to the element', () => {
      const element = createTag(config);

      expect(element.getAttribute('id')).to.equal('test-id');
      expect(element.getAttribute('class')).to.equal('test-class');
      expect(element.textContent).to.equal('Test Content');

      element.click();
      expect(clickListener.called).to.be.true;
    });

    it('should return null if tag name is not a string', () => {
      const invalidConfig = { ...config, tag: null };
      const element = createTag(invalidConfig);
      expect(element).to.be.null;
    });

    it('should handle different types of tags', () => {
      config.tag = 'span';
      const spanElement = createTag(config);
      expect(spanElement.tagName.toLowerCase()).to.equal('span');

      config.tag = 'p';
      const pElement = createTag(config);
      expect(pElement.tagName.toLowerCase()).to.equal('p');
    });

    // Additional test cases for other scenarios can be added as needed
  });

  describe('extendTag', () => {
    let element;
    let config;
    let clickListener;

    beforeEach(() => {
      element = document.createElement('div');
      clickListener = sinon.fake();
      config = {
        attrs: { id: 'test-id', class: 'test-class' },
        lstnrs: { click: clickListener },
        text: 'Test Text',
      };
    });

    it('should apply attributes to the element', () => {
      const extendedElement = extendTag(element, config);
      expect(extendedElement.getAttribute('id')).to.equal('test-id');
      expect(extendedElement.getAttribute('class')).to.equal('test-class');
    });

    it('should add event listeners to the element', () => {
      const extendedElement = extendTag(element, config);
      extendedElement.click();
      expect(clickListener.called).to.be.true;
    });

    it('should not add a listener if it is not a function', () => {
      const invalidListener = { notAFunction: true };
      config = {
        ...config,
        lstnrs: { click: invalidListener },
      };

      const spy = sinon.spy(element, 'addEventListener');
      extendTag(element, config);
      expect(spy.notCalled).to.be.true;
      spy.restore();
    });

    it('should set text content of the element', () => {
      const extendedElement = extendTag(element, config);
      expect(extendedElement.textContent).to.equal('Test Text');
    });

    it('should handle empty or missing configuration parts', () => {
      const emptyConfig = {};
      const extendedElement = extendTag(element, emptyConfig);
      expect(extendedElement.getAttribute('id')).to.be.null;
      expect(extendedElement.getAttribute('class')).to.be.null;
      expect(extendedElement.textContent).to.equal('');
    });

    it('should ignore non-object config attributes and listeners', () => {
      const invalidConfig = { attrs: null, lstnrs: 'not-an-object', text: 'Still valid text' };
      const extendedElement = extendTag(element, invalidConfig);
      expect(extendedElement.textContent).to.equal('Still valid text');
    });
  });

  describe('globToRegExp', () => {
    it('should convert a simple glob to a RegExp', () => {
      const glob = '*.js';
      const regex = globToRegExp(glob);
      expect(regex.test('file.js')).to.be.true;
      expect(regex.test('file.txt')).to.be.false;
    });

    it('should correctly handle glob with **', () => {
      const glob = '**/*.js';
      const regex = globToRegExp(glob);
      expect(regex.test('dir/file.js')).to.be.true;
      expect(regex.test('dir/subdir/file.js')).to.be.true;
      expect(regex.test('file.js')).to.be.false;
    });

    it('should handle empty or undefined glob by using **', () => {
      let glob;
      let regex = globToRegExp(glob);
      expect(regex.test('anything')).to.be.true;

      glob = '';
      regex = globToRegExp(glob);
      expect(regex.test('anything')).to.be.true;
    });

    it('should escape dots in the glob pattern', () => {
      const glob = 'file.*.js';
      const regex = globToRegExp(glob);
      expect(regex.test('file.123.js')).to.be.true;
      expect(regex.test('file123js')).to.be.false;
    });

    it('should handle complex glob patterns', () => {
      const glob = 'dir/*/file-*.js';
      const regex = globToRegExp(glob);
      expect(regex.test('dir/subdir/file-123.js')).to.be.true;
      expect(regex.test('dir/subdir/extra/file-123.js')).to.be.false;
    });
  });
});
