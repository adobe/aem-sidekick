/*
 * Copyright 2021 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
/* eslint-disable no-console, import/no-extraneous-dependencies */

import fs from 'fs-extra';
import archiver from 'archiver';

function copyManifestKeys(sourceObj, browser) {
  const targetObj = {};
  Object.keys(sourceObj).forEach((sourceKey) => {
    let targetKey = sourceKey;
    if (sourceKey.startsWith('__')) {
      // only copy key if prefix matches browser
      if (sourceKey.startsWith(`__${browser}__`)) {
        targetKey = sourceKey.split('__').pop();
      } else {
        return;
      }
    }
    if (typeof sourceObj[sourceKey] === 'object') {
      if (Array.isArray(sourceObj[sourceKey])) {
        targetObj[targetKey] = sourceObj[sourceKey].map((key) => key);
      } else {
        targetObj[targetKey] = copyManifestKeys(sourceObj[sourceKey], browser);
      }
    } else {
      targetObj[targetKey] = sourceObj[sourceKey];
    }
  });
  return targetObj;
}

async function buildManifest(browser) {
  const targetPath = `./dist/${browser}/manifest.json`;
  let targetMF = {};
  try {
    const sourceMF = await fs.readJson('./src/extension/manifest.json');
    targetMF = copyManifestKeys(sourceMF, browser);
  } catch (e) {
    throw new Error(`  failed to read source manifest.json: ${e.message}`);
  }
  try {
    await fs.ensureFile(targetPath);
    await fs.writeFile(targetPath, JSON.stringify(targetMF, null, '  '), { encoding: 'utf-8' });
  } catch (e) {
    throw new Error(`  failed to write target manifest.json: ${e.message}`);
  }
  console.log(`  ${browser}-specific manifest.json created at ${targetPath}`);
}

function zipExtension(browser) {
  const dir = `./dist/${browser}`;
  const zip = `${dir}.zip`;
  const output = fs.createWriteStream(zip);
  const archive = archiver('zip', {
    zlib: { level: 9 },
  });
  archive.on('error', (e) => {
    throw new Error(`failed to zip extension: ${e.message}`);
  });

  archive.pipe(output);
  archive.directory(dir, false);
  archive.finalize();

  console.log(`  zip created at ${zip}`);
}

export default function sidekickManifestBuildPlugin(browser) {
  return {
    name: 'sidekick-manifest-build',
    generateBundle() {
      // Code to run after bundle is generated
      console.log(`building ${browser} extension...`);
      buildManifest(browser)
        .then(() => {
          if (browser === 'chrome') {
            zipExtension(browser);
          }
          console.log('done.');
        })
        .catch((e) => {
          console.error(e);
          process.exit(1);
        });
    },
  };
}
