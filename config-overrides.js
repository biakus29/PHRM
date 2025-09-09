const path = require('path');

module.exports = function override(config, env) {
  // Ignorer les source maps manquants pour html5-qrcode
  config.module.rules.push({
    test: /\.(js|mjs|jsx|ts|tsx)$/,
    enforce: 'pre',
    use: ['source-map-loader'],
    exclude: /node_modules\/html5-qrcode/,
  });

  return config;
};
