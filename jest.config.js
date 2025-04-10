const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tsconfig');

module.exports = {
  // Use jest-expo preset for environment setup (globals, native mocks)
  preset: 'jest-expo',
  transformIgnorePatterns: [
    // Keep existing ignore patterns, especially for react-native related modules
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|uuid))',
  ],
  setupFiles: ['<rootDir>/jest.setup-before-env.js'], 
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'], 
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  // moduleDirectories is usually not needed when using tsconfig paths/baseUrl
  // moduleDirectories: ['node_modules', '<rootDir>'], 
  moduleNameMapper: {
    // Generate mappings from tsconfig paths
    ...pathsToModuleNameMapper(compilerOptions.paths || {}, { prefix: '<rootDir>/' }),

    // **IMPORTANT**: Explicit mock mappings MUST come AFTER the generated paths
    // to ensure they override the default resolution for mocked modules.
    '^@/lib/supabase$': '<rootDir>/lib/__mocks__/supabase.ts',
    '^@/providers/AuthProvider$': '<rootDir>/providers/__mocks__/AuthProvider.tsx',
    '^expo-modules-core$': '<rootDir>/__mocks__/expo-modules-core.ts', // Explicitly map expo-modules-core
    '^expo$': '<rootDir>/__mocks__/expo.ts', // Explicitly map expo

    // Add other non-alias mappings if needed (e.g., for assets)
    '^.+\\.(png|jpg|jpeg|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',
    '^@/(.*)$': '<rootDir>/$1',
  },
  transform: {
    // Use babel-jest for JS/JSX (configured by babel.config.js -> babel-preset-expo)
    '^.+\\.jsx?$': 'babel-jest',
    // Use ts-jest for TS/TSX, integrating with Babel
    '^.+\\.tsx?$': ['ts-jest', { 
      tsconfig: 'tsconfig.json', 
      babelConfig: true,
      diagnostics: {
        ignoreCodes: [], // Report all TS diagnostics
        pretty: true,
      }
    }], 
  },
  roots: ['<rootDir>'],
  modulePaths: ['<rootDir>'],
};
