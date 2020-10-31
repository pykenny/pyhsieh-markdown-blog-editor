#!/usr/bin/env node
/* eslint-disable import/no-extraneous-dependencies */
/* ^^ We're using this for development now, so simply skip the warnings here */
const Path = require('path');
const fs = require('fs');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const Bundler = require('parcel-bundler');
const express = require('express');
// const apis = require('../src/js/apis');

// Argument Setings
const { argv } = yargs(hideBin(process.argv))
  .usage('Usage: $0 [options]')
  .example(
    '$0 --port 4000 --img-dir ./imgs',
    'Start the server at port 4000, and using "img" folder under root directory.',
  )
  .example(
    '$0 -p 4000 -d ./imgs',
    'Do the same thing as above',
  )
  .options({
    port: {
      alias: 'p',
      describe: 'Port of the frontend content server',
      type: 'number',
      nargs: 1,
      default: 3000,
    },
    'img-dir': {
      alias: 'd',
      describe: 'Directory for accessing image content. If you are using relative path, please note that the working directory is "server" folder under the root directory.',
      type: 'string',
      nargs: 1,
      default: Path.normalize(Path.join(__dirname, 'img')),
    },
  });

const serverPort = argv.port;
const fullImageDir = Path.normalize(argv['img-dir'].startsWith('.')
  ? Path.join(__dirname, argv['img-dir'])
  : argv['img-dir']);

// Development Server Settings
const frontEndPageEntry = Path.join(__dirname, '../src/views/*.html');
const frontEndDevServerOptions = {
  outDir: Path.join(__dirname, '../dist'),
  publicUrl: '/',
  watch: true,
  cache: false,
  minify: false,
  logLevel: 4,
  hmr: true,
};
const bundler = new Bundler(frontEndPageEntry, frontEndDevServerOptions);

const devServer = express();

if (
  !fs.existsSync(fullImageDir)
  || !fs.lstatSync(fullImageDir).isDirectory()
) {
  fs.mkdirSync(fullImageDir);
}

devServer.use('/img', express.static(argv['img-dir']));

// Pass the Parcel bundler into Express as middleware
devServer.use(bundler.middleware());

// Run your Express server
devServer.listen(serverPort);
