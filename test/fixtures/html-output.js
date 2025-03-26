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
/* eslint-disable no-unused-expressions */

export const OUTPUT_AEM = `
<!DOCTYPE html>
<html>
  <head>
    <title>Home | AEM Boilerplate</title>
    <link rel="canonical" href="https://main--aem-boilerplate--adobe.aem.page/">
    <meta name="description" content="Use this template repository as the starting point for new AEM projects.">
    <meta property="og:title" content="Home | AEM Boilerplate">
    <meta property="og:description" content="Use this template repository as the starting point for new AEM projects.">
    <meta property="og:url" content="https://main--aem-boilerplate--adobe.aem.page/">
    <meta property="og:image" content="https://main--aem-boilerplate--adobe.aem.page/media_1dc0a2d290d791a050feb1e159746f52db392775a.jpeg?width=1200&#x26;format=pjpg&#x26;optimize=medium">
    <meta property="og:image:secure_url" content="https://main--aem-boilerplate--adobe.aem.page/media_1dc0a2d290d791a050feb1e159746f52db392775a.jpeg?width=1200&#x26;format=pjpg&#x26;optimize=medium">
    <meta property="og:image:alt" content="Decorative double Helix">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="Home | AEM Boilerplate">
    <meta name="twitter:description" content="Use this template repository as the starting point for new AEM projects.">
    <meta name="twitter:image" content="https://main--aem-boilerplate--adobe.aem.page/media_1dc0a2d290d791a050feb1e159746f52db392775a.jpeg?width=1200&#x26;format=pjpg&#x26;optimize=medium">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <script src="/scripts/aem.js" type="module"></script>
    <script src="/scripts/scripts.js" type="module"></script>
    <link rel="stylesheet" href="/styles/styles.css">
  </head>
  <body>
    <header></header>
    <main>
      <div>
        <p>
          <picture>
            <source type="image/webp" srcset="./media_1dc0a2d290d791a050feb1e159746f52db392775a.jpeg?width=2000&#x26;format=webply&#x26;optimize=medium" media="(min-width: 600px)">
            <source type="image/webp" srcset="./media_1dc0a2d290d791a050feb1e159746f52db392775a.jpeg?width=750&#x26;format=webply&#x26;optimize=medium">
            <source type="image/jpeg" srcset="./media_1dc0a2d290d791a050feb1e159746f52db392775a.jpeg?width=2000&#x26;format=jpeg&#x26;optimize=medium" media="(min-width: 600px)">
            <img loading="lazy" alt="Decorative double Helix" src="./media_1dc0a2d290d791a050feb1e159746f52db392775a.jpeg?width=750&#x26;format=jpeg&#x26;optimize=medium" width="1600" height="886">
          </picture>
        </p>
        <h1 id="congrats-you-are-ready-to-go">Congrats, you are ready to go!</h1>
        <p>Your forked repo is set up as an AEM Project and you are ready to start developing.<br>The content you are looking at is served from this <a href="https://drive.google.com/drive/folders/1MGzOt7ubUh3gu7zhZIPb7R7dyRzG371j?usp=sharing">Google Drive</a><br><br>Adjust the <code>fstab.yaml</code> to point to a folder either in your sharepoint or your gdrive that you shared with AEM. See the full tutorial here:<br><br><a href="https://bit.ly/3aImqUL">https://www.aem.live/tutorial</a></p>
        <h2 id="this-is-another-headline-here-for-more-content">This is another headline here for more content</h2>
        <div class="columns">
          <div>
            <div>
              <p>Columns block</p>
              <ul>
                <li>One</li>
                <li>Two</li>
                <li>Three</li>
              </ul>
              <p><a href="/">Live</a></p>
            </div>
            <div>
              <picture>
                <source type="image/webp" srcset="./media_17e9dd0aae03d62b8ebe2159b154d6824ef55732d.png?width=2000&#x26;format=webply&#x26;optimize=medium" media="(min-width: 600px)">
                <source type="image/webp" srcset="./media_17e9dd0aae03d62b8ebe2159b154d6824ef55732d.png?width=750&#x26;format=webply&#x26;optimize=medium">
                <source type="image/png" srcset="./media_17e9dd0aae03d62b8ebe2159b154d6824ef55732d.png?width=2000&#x26;format=png&#x26;optimize=medium" media="(min-width: 600px)">
                <img loading="lazy" alt="green double Helix" src="./media_17e9dd0aae03d62b8ebe2159b154d6824ef55732d.png?width=750&#x26;format=png&#x26;optimize=medium" width="1600" height="1066">
              </picture>
            </div>
          </div>
          <div>
            <div>
              <picture>
                <source type="image/webp" srcset="./media_143cf1a441962c90f082d4f7dba2aeefb07f4e821.png?width=2000&#x26;format=webply&#x26;optimize=medium" media="(min-width: 600px)">
                <source type="image/webp" srcset="./media_143cf1a441962c90f082d4f7dba2aeefb07f4e821.png?width=750&#x26;format=webply&#x26;optimize=medium">
                <source type="image/png" srcset="./media_143cf1a441962c90f082d4f7dba2aeefb07f4e821.png?width=2000&#x26;format=png&#x26;optimize=medium" media="(min-width: 600px)">
                <img loading="lazy" alt="Yellow Double Helix" src="./media_143cf1a441962c90f082d4f7dba2aeefb07f4e821.png?width=750&#x26;format=png&#x26;optimize=medium" width="644" height="470">
              </picture>
            </div>
            <div>
              <p>Or you can just view the preview</p>
              <p><em><a href="/">Preview</a></em></p>
            </div>
          </div>
        </div>
      </div>
    </main>
    <footer></footer>
  </body>
</html>`;

export const OUTPUT_RANDOM = `
<html><head>
  <script src="/foo.js" type="module"></script>
  <link rel="stylesheet" href="/foo.css">
  </head><body>
  <h1 id="congrats-you-are-ready-to-go">Congrats, you are ready to go!</h1>
  <p>Lorem ipsum dolor sit amet.</p>
</body></html>`;
