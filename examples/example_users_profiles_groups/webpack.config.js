const path = require('path');

module.exports = (env, argv) => {

  const envToMode = env => {
    if (env !== 'production' && env !== 'development') {
      return 'none';
    }
    return env;
  };

  const envToFilename = env => {
    if (env === 'production') {
      return 'main.min.js';
    }
    return 'main.js';
  };

  return {
    entry: ['@babel/polyfill', './src/index.js'],
    output: {
      path: path.resolve(__dirname, 'lib'),
      filename: envToFilename(env),
    },
    mode: envToMode(env),
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            options: {
              presets: ['@babel/preset-env', '@babel/preset-react']
            }
          }
        }
      ]
    }
  }
};
