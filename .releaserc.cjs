module.exports = {
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    // todo: add back when we have a safari project
    // ['semantic-release-react-native', {
    //   'versionStrategy': {
    //     'ios': { 'buildNumber': 'semantic' },
    //   },
    //   'iosPath': 'src/safari',
    //   'skipAndroid': true,
    // }],
    ['@semantic-release/changelog', {
      'changelogFile': 'CHANGELOG.md',
    }],
    ["@semantic-release/npm", {
      npmPublish: false,
    }],
    ['@semantic-release/git', {
      'assets': [
        'package.json',
        'CHANGELOG.md',
        'src/extension/manifest.json',
        // todo: add back when we have a safari project
        // 'src/safari/helix-sidekick-extension.xcodeproj/project.pbxproj'
      ],
      'message': 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
    }],
    ['@semantic-release/github', {}],
    ['@semantic-release/exec', {
      publishCmd: 'npm run publish:chrome',
    }],
    ['semantic-release-slack-bot', {
      notifyOnSuccess: true,
      notifyOnFail: true,
      markdownReleaseNotes: true,
      slackChannel: 'helix-escalations',
    }],
    ['semantic-release-discord-bot', {
      notifications: [{ branch: 'main' }],
    }],
  ],
  branches: ['main'],
};
