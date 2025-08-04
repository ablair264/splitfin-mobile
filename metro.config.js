const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Fix for React Native Firebase ES modules
config.resolver.unstable_enablePackageExports = true;
config.resolver.unstable_enableSymlinks = true;

module.exports = config;
