# AEM Sidekick

> Browser extension for authoring AEM sites

## Status
[![codecov](https://img.shields.io/codecov/c/github/adobe/aem-sidekick.svg)](https://codecov.io/gh/adobe/aem-sidekick)
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/adobe/aem-sidekick/main.yaml)
[![GitHub license](https://img.shields.io/github/license/adobe/aem-sidekick.svg)](https://github.com/adobe/aem-sidekick/blob/master/LICENSE.txt)
[![GitHub issues](https://img.shields.io/github/issues/adobe/aem-sidekick.svg)](https://github.com/adobe/aem-sidekick/issues)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

## Installation

1. Go to the [Chrome Web Store](https://chromewebstore.google.com/detail/aem-sidekick/igkmdomcgoebiipaifhmpfjhbjccggml)
1. Click _Add to Chrome_
1. Confirm by clicking _Add extension_
1. Click the extensions icon next to Chrome's address bar to see a list of all extensions:<br />
![Extensions icon](docs/imgs/install_extensions_icon.png)
1. Verify that there's an icon like this:<br />
![Sidekick extension icon](docs/imgs/install_toolbar_icon.png)<br />
1. Click the pin button next to it to make sure it always stays visible.

## Development

### Install Dependencies

```bash
$ npm install
```

### Build and Test Locally

1. Start the development server to trigger a build on each code change:
   ```
   $ npm run build:watch
   ```
1. Open Chrome and navigate to `chrome://extensions`
1. Turn on _Developer mode_ at the top right of the header bar<br />
![Developer mode](docs/imgs/install_developer_mode.png)
1. Click the _Load unpacked_ button in the action bar<br />
![Load unpacked](docs/imgs/install_load_unpacked.png)
1. Navigate to the `dist > chrome` folder and click _Select_ to install and activate the Sidekick extension.
1. Verify that your _Extensions_ page displays a card like this:<br />
![Extension box](docs/imgs/install_extension_card.png)<br />
1. Click the extensions icon next to Chrome's address bar to see a list of all extensions:<br />
![Extensions icon](docs/imgs/install_extensions_icon.png)
1. Verify that there's an icon like this:<br />
![Sidekick extension icon](docs/imgs/install_toolbar_icon.png)<br />
1. Click the pin icon next to it to make sure it always stays visible.

#### Code Changes

- Keep `npm run build:watch` running during development. The build usually takes between 1 and 3 seconds.
- Changes to the application (everything under `app`) require a reload of the tab.
- Changes to the service worker (`background.js` and its includes) require a reload of the extension by clicking the reload icon on the extension card.



### Run All Tests

```bash
$ npm test
```

### Debug Browser Tests

```bash
$ npm run test:watch
```

### Lint

```bash
$ npm run lint
```

### Build All

```bash
$ npm run build
```

### Build Chrome

```bash
$ npm run build:chrome
```

...

## Deployment

...
