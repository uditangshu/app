const { getDefaultConfig } = require('@expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

defaultConfig.resolver.sourceExts = [...defaultConfig.resolver.sourceExts, 'mjs', 'cjs'];

// Add watchman configuration
defaultConfig.watchFolders = [__dirname];
defaultConfig.resolver.nodeModulesPaths = [__dirname + '/node_modules'];

// Add transformer configuration
defaultConfig.transformer = {
  ...defaultConfig.transformer,
  minifierPath: require.resolve('metro-minify-terser'),
};

module.exports = defaultConfig; 