const path = require('path');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // ESMの拡張子解決問題を修正
      webpackConfig.resolve.extensionAlias = {
        '.js': ['.js', '.ts', '.tsx'],
        '.jsx': ['.jsx', '.tsx'],
      };

      // react-dndのESMモジュール問題を解決
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        "react/jsx-runtime": require.resolve("react/jsx-runtime"),
        "react/jsx-dev-runtime": require.resolve("react/jsx-dev-runtime"),
      };

      return webpackConfig;
    },
  },
};
