const webpack = require('webpack');
const path = require('path');

const BUILD_DIR = path.resolve(__dirname, 'src/client/public');
const APP_DIR = path.resolve(__dirname, 'src/client/app');

const config = {
  entry: {
    app: APP_DIR + '/index.jsx'
  },
  devServer: {
    hot: true,
  },
  plugins: [
    new webpack.NamedModulesPlugin()
  ],
  output: {
    path: BUILD_DIR,
    filename: 'bundle.js'
  },
  module : {
    rules : [
      {
        test : /\.jsx?/,
        include : APP_DIR,
        use: {
          loader : 'babel-loader',
          options: {
            presets: ['es2015', 'react', 'stage-2'],
            retainLines: true
          }
        }
      }
    ]
  }
};

module.exports = config;
