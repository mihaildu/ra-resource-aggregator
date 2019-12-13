const path = require('path');
const pkg = require('./package.json');

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
    entry: './src/index.js',
    output: {
      path: path.resolve(__dirname, 'lib'),
      filename: envToFilename(env),
      library: pkg.name,
      libraryTarget: 'umd',
    },
    mode: envToMode(env),
    module: {
      rules: [
        { test: /\.js$/, exclude: /node_modules/, loader: "babel-loader" }
      ]
    }
  }
};
