module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
          alias: {
            '@': './',
            '@app': './app',
            '@components': './app/components',
            '@screens': './app/screens',
            '@navigation': './app/navigation',
            '@hooks': './app/hooks',
            '@utils': './app/utils',
            '@assets': './assets'
          }
        }
      ],
      'react-native-reanimated/plugin'
    ]
  };
};