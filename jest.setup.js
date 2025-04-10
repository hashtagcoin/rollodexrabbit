// jest.setup.js
// This file runs AFTER the test environment is set up.

// Extend Jest matchers for React Native Testing Library
// This MUST run after the environment (with 'expect') is ready.
import '@testing-library/jest-native/extend-expect';

// Mock React Native's Animated module
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.NativeModules.NativeAnimatedHelper = {
    startOperationBatch: jest.fn(),
    finishOperationBatch: jest.fn(),
    createAnimatedNode: jest.fn(),
    getValue: jest.fn(),
  };
  return RN;
});

// Mock Expo modules
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
}));

jest.mock('expo-font', () => ({
  useFonts: jest.fn().mockReturnValue([true, null]),
}));

jest.mock('expo-asset');
jest.mock('expo-constants', () => ({
  Constants: {
    ...jest.requireActual('expo-constants').Constants,
    expoConfig: {
      extra: {
        supabaseUrl: 'test-url',
        supabaseAnonKey: 'test-key',
      },
      ios: { supportsTablet: true },
      android: {},
      web: {},
      windows: {},
      macos: {},
    },
  },
}));

jest.mock('expo-linking', () => ({
  createURL: jest.fn(),
  getInitialURL: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  openURL: jest.fn(),
  canOpenURL: jest.fn(),
  getPathFromURL: jest.fn(),
  parse: jest.fn(),
}));

// Mock @react-native-segmented-control/segmented-control
jest.mock('@react-native-segmented-control/segmented-control', () => {
  const React = require('react');
  const { View, Text, TouchableOpacity } = require('react-native');

  return (props) => {
    const { values, selectedIndex, onChange } = props;
    return (
      React.createElement(View, { style: { flexDirection: 'row' } },
        values.map((value, index) => (
          React.createElement(TouchableOpacity, {
            key: value,
            onPress: () => {
              // Simulate the onChange event with the native event structure
              if (onChange) {
                onChange({ nativeEvent: { selectedSegmentIndex: index } });
              }
            },
            testID: `segment-${value}` // Add testID for easier selection if needed
          },
            React.createElement(Text, {
              style: {
                padding: 5,
                fontWeight: index === selectedIndex ? 'bold' : 'normal'
              }
            }, value)
          )
        ))
      )
    );
  };
});

// Add any other global setup needed for your tests below
// For example, mocking other native modules or globals

console.log('Jest setup AFTER environment loaded (jest.setup.js).');
