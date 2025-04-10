// __mocks__/expo-modules-core.ts

import { jest } from '@jest/globals';

// Mock NativeModules to prevent errors when accessed
export const NativeModules = {};

// Mock EventEmitter to satisfy basic imports
export class EventEmitter {
  addListener = jest.fn();
  removeListeners = jest.fn();
  emit = jest.fn();
}

// Mock any other exports that might be causing issues if necessary
export const requireNativeModule = jest.fn(() => ({}));

// Basic mock implementation for expo-modules-core
export const expoModulesCore = {
  NativeModulesProxy: {},
  requireNativeViewManager: jest.fn(() => ({})),
  // Add other exports as needed based on errors
  Font: {
    isLoaded: jest.fn().mockReturnValue(true), // Mock isLoaded
    loadAsync: jest.fn().mockImplementation(() => Promise.resolve()), // Mock loadAsync explicitly
  },
};

// Add other exports as needed based on errors
