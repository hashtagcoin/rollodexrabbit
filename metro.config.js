// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add any project-specific configurations
config.resolver.extraNodeModules = {
  '@': path.resolve(__dirname, './app'),
  '@/lib': path.resolve(__dirname, './lib'),
  '@/providers': path.resolve(__dirname, './providers'),
  ...config.resolver.extraNodeModules,
};

// Add support for symlinks (important for monorepos)
config.resolver.sourceExts = ['js', 'jsx', 'json', 'ts', 'tsx', 'cjs', 'mjs'];
config.resolver.assetExts = ['bmp', 'gif', 'jpg', 'jpeg', 'png', 'psd', 'svg', 'webp', 'ttf', 'otf', 'woff', 'woff2'];
config.watchFolders = [path.resolve(__dirname)];

module.exports = config;
