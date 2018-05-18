const path = require('path');
const slsw = require('serverless-webpack');
const nodeExternals = require('webpack-node-externals')

module.exports = {
  entry: slsw.lib.entries,
  // externals: [nodeExternals()],
  resolve: {
    extensions: [
      '.js',
      '.jsx',
      '.json',
      '.ts',
      '.tsx'
    ]
  },
  output: {
    libraryTarget: 'umd',
    path: path.join(__dirname, '.webpack'),
    filename: '[name].js',
  },
  target: 'node',
  module: {
    loaders: [
      { test: /\.ts(x?)$/, loader: 'ts-loader' },
    ],
  },
};
