// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Create the default Metro config
const config = getDefaultConfig(__dirname);

// Add any project-specific configurations
config.resolver = {
  ...config.resolver,
  // Add support for symlinks (important for monorepos)
  sourceExts: ['js', 'jsx', 'json', 'ts', 'tsx', 'cjs', 'mjs'],
  assetExts: [
    'bmp', 'gif', 'jpg', 'jpeg', 'png', 'psd', 'svg', 'webp', 'ttf', 'otf', 'woff', 'woff2', 'pdf'
  ].filter(ext => !config.resolver.assetExts.includes(ext)),
  
  // Handle Node.js core modules
  extraNodeModules: {
    ...config.resolver.extraNodeModules,
    // Mock Node.js core modules
    'crypto': require.resolve('crypto-browserify'),
    'stream': require.resolve('stream-browserify'),
    'util': require.resolve('util/'),
    'zlib': require.resolve('browserify-zlib'),
    'fs': false, // Mock fs module
    'path': require.resolve('path-browserify'),
    'http': false, // Mock http module
    'https': false, // Mock https module
    'os': require.resolve('os-browserify/browser'),
    // Add any other module resolutions if needed
  },
  
  // Use custom resolver for problematic modules
  resolveRequest: (context, moduleName, platform) => {
    // Map of module names to their shim paths
    const shims = {
      'pdf-lib': 'shims/pdf-lib/index.js',
      './PDFAcroTerminal': 'shims/pdf-lib/PDFAcroTerminal.js',
      './PDFAcroForm': 'shims/pdf-lib/PDFAcroForm.js',
      './PDFField': 'shims/pdf-lib/PDFField.js',
      './PDFDocument': 'shims/pdf-lib/PDFDocument.js',
      // Add more shims as needed
    };

    // Check if the requested module has a shim
    const shimPath = shims[moduleName];
    if (shimPath) {
      return {
        filePath: path.resolve(__dirname, shimPath),
        type: 'sourceFile',
      };
    }
    
    // Fall back to the standard Metro resolver
    return context.resolveRequest(context, moduleName, platform);
  },
};

// Add transformer for handling assets
config.transformer = {
  ...config.transformer,
  // Add any custom transformers if needed
};

// Watch the project directory
config.watchFolders = [
  path.resolve(__dirname),
  // Add any additional paths to watch
];

// Reset the cache
config.resetCache = true;

module.exports = config;
