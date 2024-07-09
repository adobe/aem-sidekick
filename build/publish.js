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
/* eslint-disable no-console, import/no-extraneous-dependencies, no-case-declarations */

import fs from 'fs-extra';
import shell from 'shelljs';
import { h1 } from '@adobe/fetch';

const { fetch } = h1();

const supportedBrowsers = ['chrome'];
const packageJson = './package.json';
const manifestJson = './src/extension/manifest.json';

const {
  GOOGLE_APP_ID,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REFRESH_TOKEN,
} = process.env;

async function publishExtension(browser) {
  // sync version in manifest.json with package.json
  try {
    const { version } = fs.readJSONSync(packageJson);
    const json = fs.readJSONSync(manifestJson);
    const { version: oldVersion } = json;
    json.version = version;
    fs.writeJsonSync(manifestJson, json, { spaces: 2 });
    const msg = `chore(release): update manifest version to ${version} [skip ci]`;
    const { code, stderr } = shell.exec(`git add ${manifestJson} && git commit -m"${msg}" && git push`);
    if (code > 0) {
      throw new Error(stderr);
    }
    console.log(`manifest version updated from ${oldVersion} to ${version}`);
  } catch (e) {
    console.error(`failed to update manifest version: ${e.message}`);
    process.exit(1);
  }

  if (browser === 'chrome') {
    // get access token
    const tokenResp = await fetch('https://accounts.google.com/o/oauth2/token', {
      method: 'POST',
      body: new URLSearchParams([
        ['client_id', GOOGLE_CLIENT_ID],
        ['client_secret', GOOGLE_CLIENT_SECRET],
        ['refresh_token', GOOGLE_REFRESH_TOKEN],
        ['grant_type', 'refresh_token'],
        ['redirect_uri', 'urn:ietf:wg:oauth:2.0:oob'],
      ]),
    });
    if (!tokenResp.ok) {
      const msg = await tokenResp.text();
      throw new Error(`failed to retrieve access token: ${tokenResp.status} ${msg}`);
    }
    const { access_token: ACCESS_TOKEN } = await tokenResp.json();

    // upload zip
    const uploadResp = await fetch(`https://www.googleapis.com/upload/chromewebstore/v1.1/items/${GOOGLE_APP_ID}`, {
      method: 'PUT',
      headers: {
        authorization: `Bearer ${ACCESS_TOKEN}`,
        'x-goog-api-version': 2,
      },
      body: Buffer.from(fs.readFileSync('./dist/chrome.zip')),
    });
    if (!uploadResp.ok) {
      throw new Error(`upload failed: ${uploadResp.status} ${await uploadResp.text()}`);
    }
    const { uploadState, itemError } = await uploadResp.json();
    if (uploadState === 'FAILURE') {
      const message = itemError && itemError[0] && itemError[0].error_detail;
      throw new Error(`upload failed: ${message}`);
    }

    // publish extension
    const publishResp = await fetch(`https://www.googleapis.com/chromewebstore/v1.1/items/${GOOGLE_APP_ID}/publish`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${ACCESS_TOKEN}`,
        'x-goog-api-version': 2,
        'content-length': 0,
      },
    });
    if (!publishResp.ok) {
      throw new Error(`publication failed: ${publishResp.status} ${await publishResp.text()}`);
    }
    const { status, statusDetail } = await publishResp.json();
    if (status[0] !== 'OK') {
      throw new Error(`publication failed: ${statusDetail[0]}`);
    }
  }
  console.log('  successfully published');
}

// run publish script
const browser = process.argv[2];
if (!browser) {
  console.log(`specify one of the following browsers: ${supportedBrowsers.join(', ')}`);
  process.exit(0);
}
if (!supportedBrowsers.includes(browser)) {
  console.error(`unsupported browser ${browser}`);
  process.exit(1);
}

console.log(`publishing chrome extension ${GOOGLE_APP_ID}...`);

publishExtension(browser)
  .then(() => console.log('done.'))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
