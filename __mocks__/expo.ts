// __mocks__/expo.ts

// Provide minimal mocks for functions/components used from 'expo'
// that might be causing issues during test setup.

// Example: Mocking registerRootComponent if it's indirectly causing problems
export const registerRootComponent = (component: React.ComponentType<any>) => component;

// Mock useFonts (if not already handled adequately elsewhere)
export const useFonts = jest.fn(() => [true, null]);

// Mock any other specific exports from 'expo' that appear in errors.
// It might be sufficient to leave it minimal for now.

// Add a default export if the original module has one
export default {}; 
