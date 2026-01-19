const path = require('path');
const pkg = require('../package.json');
const rncfg = require('../react-native.config.js');

module.exports = {
  project: {
    ios: {
      automaticPodsInstallation: true,
    },
  },
  dependencies: {
    [pkg.name]: {
      root: path.join(__dirname, '..'),
      platforms: rncfg.dependencies.platforms,
    },
  },
};
