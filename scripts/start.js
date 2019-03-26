'use strict';

// Do this as the first thing so that any code reading it knows the right env.
process.env.BABEL_ENV = 'development';
process.env.NODE_ENV = 'development';

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on('unhandledRejection', err => {
  throw err;
});

// Ensure environment variables are read.
require('../client/env');

const fs = require('fs');
const chalk = require('chalk');
const spawn = require('cross-spawn');
const webpack = require('webpack');
const exec = require('child_process').exec;
const WebpackDevServer = require('webpack-dev-server');
const clearConsole = require('react-dev-utils/clearConsole');
const {
  choosePort,
  createCompiler,
  prepareProxy,
  prepareUrls,
} = require('react-dev-utils/WebpackDevServerUtils');
const openBrowser = require('react-dev-utils/openBrowser');
const paths = require('../config/paths');
const config = require('../client/webpack.config.dev');
const createDevServerConfig = require('../client/webpackDevServer.config');
const _ = require('lodash');

const checkPagesRequired = require('../tools').checkPagesRequired;

const useYarn = fs.existsSync(paths.yarnLockFile);
const isInteractive = process.stdout.isTTY;

// Warn and crash if required files are missing
if (!checkPagesRequired(paths.allPages)) {
  process.exit(1);
}

// console.log('earth-scripts')

// Tools like Cloud9 rely on this.
const DEFAULT_PORT = parseInt(process.env.CLIENT_PORT, 10) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// start mock server depends `npm run start -- stopmock`
const isStopmock = process.argv.slice(2).find((v) => v === 'stopmock' );

if (!isStopmock) {
    require('./mock');
}

//todo 优化
// if (process.platform === 'win32') {
//
//   exec('mock/test.bat')
//
// } else if (process.platform === 'darwin') {
//
//   exec('/bin/sh mock/test.sh');
//
// }

// We attempt to use the default port but if it is busy, we offer the user to
// run on a different port. `detect()` Promise resolves to the next free port.
choosePort(HOST, DEFAULT_PORT)
  .then(port => {
    if (port == null) {
      // We have not found a port.
      return;
    }
    const protocol = process.env.HTTPS === 'true' ? 'https' : 'http';
    const appName = require(paths.appPackageJson).name;
    const urls = prepareUrls(protocol, HOST, port);
    // Create a webpack compiler that is configured with custom messages.
    const compiler = createCompiler(webpack, config, appName, urls, useYarn);
    // Load proxy config
    const proxySetting = require(paths.appPackageJson).proxy;
    const proxyConfig = prepareProxy(proxySetting, paths.appPublic);
    // Serve webpack assets generated by the compiler over a web sever.
    const serverConfig = createDevServerConfig(
      proxyConfig,
      urls.lanUrlForConfig
    );
    const devServer = new WebpackDevServer(compiler, serverConfig);
    const publicPath = _.get(config, ['output', 'publicPath']);
    // Launch WebpackDevServer.
    devServer.listen(port, HOST, err => {
      if (err) {
        return console.log(err);
      }
      if (isInteractive) {
        // clearConsole();
      }
      console.log(chalk.cyan('Starting the development server...\n'));

    });

    ['SIGINT', 'SIGTERM'].forEach(function(sig) {
      process.on(sig, function() {
        devServer.close();
        process.exit();
      });
    });
  })
  .catch(err => {
    if (err && err.message) {
      console.log(err.message);
    }
    process.exit(1);
  });
