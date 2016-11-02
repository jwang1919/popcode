const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: './src/application.js',
  output: {
    path: path.resolve(__dirname, './static/compiled'),
    publicPath: '/compiled/',
    filename: 'application.js',
    sourceMapFilename: 'application.js.map',
  },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        include: [
          path.resolve(__dirname, 'src'),
          path.resolve(__dirname, 'spec'),
        ],
        loaders: ['babel-loader', 'transform/cacheable?brfs-babel'],
      },
      {
        test: /\.js$/,
        include: [
          path.resolve(__dirname, 'node_modules/htmllint'),
        ],
        loader: 'transform/cacheable?bulkify',
      },
      {
        test: /\.js$/,
        include: [
          path.resolve(__dirname, 'node_modules/PrettyCSS'),
          path.resolve(__dirname, 'node_modules/stylelint'),
          path.resolve(__dirname, 'node_modules/browserslist'),
          path.resolve(__dirname, 'node_modules/graceful-fs'),
          path.resolve(__dirname, 'node_modules/postcss'),
          path.resolve(__dirname, 'node_modules/sugarss'),
          path.resolve(__dirname, 'node_modules/fs.realpath'),
          path.resolve(__dirname, 'node_modules/postcss-scss'),
          path.resolve(__dirname, 'node_modules/autoprefixer'),
          path.resolve(__dirname, 'node_modules/css'),
        ],
        loader: 'transform/cacheable?brfs',
      },
      {
        test: /\.js$/,
        include: [
          path.resolve(__dirname, 'node_modules/redux'),
          path.resolve(__dirname, 'node_modules/lodash-es'),
          path.resolve(__dirname, 'node_modules/github-api'),
        ],
        loader: 'babel-loader',
      },
      {
        test: /\.js$/,
        include: [
          path.resolve(__dirname, 'node_modules/loop-protect'),
        ],
        loader: 'imports?define=>false',
      },
      {
        include: [
          path.resolve(
            __dirname,
            'node_modules/html-inspector/html-inspector.js'
          ),
        ],
        loader: 'imports?window=>{}!exports?window.HTMLInspector',
      },
      {
        test: /\.js$/,
        include: [
          path.resolve(__dirname, 'node_modules/brace/worker'),
        ],
        loader: 'null',
      },
      {
        test: /\.json$/,
        loader: 'json-loader',
      },
    ],
  },
  plugins: [
    new webpack.EnvironmentPlugin([
      'FIREBASE_APP',
      'GIT_REVISION',
      'LOG_REDUX_ACTIONS',
      'NODE_ENV',
      'WARN_ON_DROPPED_ERRORS',
    ]),
  ],
  resolve: {
    alias: {
      'github-api$': 'github-api/lib/GitHub.js',
      'github-api': 'github-api/lib',
      'html-inspector$': 'html-inspector/html-inspector.js',
    },
    extensions: ['.js', '.jsx'],
  },
  devtool: 'source-map',
};
