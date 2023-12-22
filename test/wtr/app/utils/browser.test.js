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

import { expect } from '@open-wc/testing';
import {
  getLocation, getProjectDetails, getResourceURL, isSupportedFileExtension, matchProjectHost,
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
});
