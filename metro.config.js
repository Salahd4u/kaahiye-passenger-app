const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

/**
 * Resolve `@/` alias to `src/` directory
 */
config.resolver.alias = {
  ...config.resolver.alias,
  '^@/(.*)$': 'src/$1',
};

/**
 * Add source extensions
 */
config.resolver.sourceExts.push('js', 'jsx', 'ts', 'tsx');

module.exports = config;