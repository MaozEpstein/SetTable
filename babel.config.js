module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // In reanimated 4.x the babel plugin moved out of
    // react-native-reanimated and into react-native-worklets.
    // It must be listed last.
    plugins: ['react-native-worklets/plugin'],
  };
};
