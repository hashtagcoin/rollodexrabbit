// Custom Metro resolver for handling problematic modules
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Get the default config
const config = getDefaultConfig(__dirname);

// Create a custom resolver
const { resolveRequest } = config.resolver;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Handle the specific error for PDFAcroTerminal
  if (moduleName === './PDFAcroTerminal') {
    return {
      filePath: path.resolve(__dirname, 'node_modules/pdf-lib/es/scripts/api/PDFAcroTerminal.js'),
      type: 'sourceFile',
    };
  }

  // Fall back to the standard Metro resolver
  return resolveRequest(context, moduleName, platform);
};

module.exports = config;
