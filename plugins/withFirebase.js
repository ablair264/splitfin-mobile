const { withPlugins } = require('@expo/config-plugins');

module.exports = function withFirebase(config) {
  // Only apply Firebase plugins during build time, not config time
  if (process.env.EAS_BUILD) {
    return withPlugins(config, [
      '@react-native-firebase/app',
      '@react-native-firebase/auth',
      '@react-native-firebase/firestore'
    ]);
  }
  return config;
};
