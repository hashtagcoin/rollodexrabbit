// jest.setup-before-env.js
// This file runs BEFORE the test environment is set up.

// Mock expo-av early
jest.mock('expo-av', () => ({
  // Provide mocks for functions/components used from expo-av
  // Example: If you use Audio or Video
  Audio: {
    Sound: {
      createAsync: jest.fn(() => Promise.resolve({ sound: { playAsync: jest.fn(), stopAsync: jest.fn(), unloadAsync: jest.fn() }, status: {} })),
      // Add other static methods if needed
    },
    Recording: { 
      // Mock recording methods if used
    },
    setAudioModeAsync: jest.fn(() => Promise.resolve()),
  },
  Video: jest.fn(() => null), // Mock Video component
  ResizeMode: {
    CONTAIN: 'contain',
    COVER: 'cover',
    STRETCH: 'stretch',
  }, // Mock ResizeMode enum
  // Add other exports like InterruptionModeIOS, InterruptionModeAndroid if needed
}));

// Mock expo-image-picker VERY EARLY as it seems to trigger the uuid issue in jest-expo setup
jest.mock('expo-image-picker', () => ({
  // Provide mocks for any functions your component *directly* uses from image picker
  // Example: If you use launchImageLibraryAsync
  launchImageLibraryAsync: jest.fn(() => Promise.resolve({ canceled: true, assets: null })),
  // Add other functions like launchCameraAsync, requestPermissionsAsync etc. if needed
  requestMediaLibraryPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  MediaTypeOptions: {
    Images: 'Images', 
    Videos: 'Videos',
    All: 'All'
  }
}));

// Mock uuid library VERY EARLY to prevent conflicts with jest-expo preset setup
jest.mock('uuid', () => ({
  v4: () => 'mock-uuid-v4',
}));

// Mock AsyncStorage early as it might be needed by libraries during initial load
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// // Mock expo-font using requireActual to preserve other exports (Attempt 1 - Failed)
// jest.mock('expo-font', () => {
//   const actual = jest.requireActual('expo-font');
//   return {
//     ...actual,
//     isLoaded: jest.fn(() => true), // Always report fonts as loaded
//   };
// });
// 
// // Mock expo-asset (recommended alongside expo-font mock for some SDKs) (Attempt 1 - Failed)
// jest.mock('expo-asset');

// Mock @expo/vector-icons directly (Attempt 2 - Per Research Solution 3)
jest.mock('@expo/vector-icons', () => {
  // Return a simple mock component (e.g., null or Text) for any icon set used
  // This prevents the Font.isLoaded error by bypassing the icon's internal logic.
  const MockIcon = ({ name, ...props }) => {
    const React = require('react'); // Require React inside the mock factory
    const { Text } = require('react-native'); // Require RN components inside
    // Optionally render the name for debugging/snapshots, or just return null
    return React.createElement(Text, props, `Icon(${name})`);
    // return null; // Alternatively, render nothing
  };

  // Add entries for *all* icon sets potentially used (Ionicons, MaterialIcons, etc.)
  return {
    Ionicons: MockIcon,
    MaterialIcons: MockIcon,
    FontAwesome: MockIcon,
    // Add other icon sets as needed...
    createIconSet: () => MockIcon, // Mock the factory function too if used directly
    createIconSetFromFontello: () => MockIcon,
    createIconSetFromIcoMoon: () => MockIcon,
  };
});

console.log('Jest setup BEFORE environment loaded.');
