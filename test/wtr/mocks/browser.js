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

function stubLocation(document, location) {
  const input = document.createElement('input');
  input.id = 'sidekick_test_location';
  input.value = location;
  document.body.appendChild(input);
}

export function resetLocation(document) {
  const input = document.getElementById('sidekick_test_location');
  if (input) {
    input.remove();
  }
}

export const sharepointEditorUrl = 'https://adobe.sharepoint.com/:w:/r/sites/HelixProjects/_layouts/15/Doc.aspx?sourcedoc=ID';
export function stubSharepointEditorLocation(document, location = sharepointEditorUrl) {
  stubLocation(document, location);
}

export const sharepointDirectoryUrl = 'https://adobe-my.sharepoint.com/personal/user_name/_layouts/15/onedrive.aspx?id=%2Fsites%2Fadobe%2FShared%20Documents%2Faem-boilerplate&listurl=https%3A%2F%2Fadobe%2Esharepoint%2Ecom%2Fsites%2Fadobe%2FShared%20Documents&viewid=d776cf70%2D9b7e%2D4ab7%2Db9da%2D9e0f8e03a7d2&view=0D';
export function stubSharepointDirectoryLocation(document, location = sharepointDirectoryUrl) {
  stubLocation(document, location);
}

export const prodUrl = 'https://www.aemboilerplate.com';
export function stubProdLocation(document, location = prodUrl) {
  stubLocation(document, location);
}
