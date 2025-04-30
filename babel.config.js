module.exports = function(api) {
  // Simple check for test environment
  const isTest = process.env.NODE_ENV === 'test';
 
  // Set caching based on the environment. Non-test envs benefit from caching.
  api.cache(!isTest);

  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Expo Router babel plugin (should come first)
      require.resolve("expo-router/babel"),

      // Module resolver plugin
      [
        'module-resolver',
        {
          root: ['./'],
          extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
          alias: {
            '@': './app',
            '@/lib': './lib',
            '@/providers': './providers',
          },
        },
      ],

      // Reanimated plugin MUST BE LAST
      'react-native-reanimated/plugin',
    ],
  };
};
