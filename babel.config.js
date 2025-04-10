module.exports = function(api) {
  // Simple check for test environment
  const isTest = process.env.NODE_ENV === 'test';
 
  // Set caching based on the environment. Non-test envs benefit from caching.
  api.cache(!isTest);

  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Always include module-resolver, regardless of environment
      [
        'module-resolver',
        {
          root: ['./'],
          extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
          alias: {
            '@': './app', // Restore general '@' mapping
            '@/lib': './lib',
            '@/providers': './providers',
            // Ensure specific aliases are listed *before* general if order matters for your use case, though often module-resolver handles it.
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
