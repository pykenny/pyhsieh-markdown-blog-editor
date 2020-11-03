#!/usr/bin/env node
/* eslint-disable import/no-extraneous-dependencies */
/* ^^ We're using this for development now, so simply skip the warnings here */
const Path = require('path');
const fs = require('fs');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const Parcel = require('@parcel/core').default;
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
// const apis = require('../src/js/apis');

// Argument Setings
const { argv } = yargs(hideBin(process.argv))
  .usage('Usage: $0 [options]')
  .example(
    '$0 --dev-port 4000 --backend-port 4001 --img-dir ./imgs',
    'Start the frontend-dev server at port 4000, service server at port 4001, and using "img" folder under root directory.',
  )
  .example(
    '$0 -f 4000 -p 4001 -d ./imgs',
    'Do the same thing as above',
  )
  .options({
    'dev-port': {
      alias: 'f',
      describe: 'Port of the frontend content dev server',
      type: 'number',
      nargs: 1,
      default: 3000,
    },
    'backend-port': {
      alias: 'p',
      describe: 'Port of the backend server',
      type: 'number',
      nargs: 1,
      default: 3001,
    },
    'img-dir': {
      alias: 'd',
      describe: 'Directory for accessing image content. If you are using relative path, please note that the working directory is "server" folder under the root directory.',
      type: 'string',
      nargs: 1,
      default: Path.normalize(Path.join(__dirname, 'img')),
    },
  });

const devPort = argv['dev-port'];
const servicePort = argv['backend-port'];

const fullImageDir = Path.normalize(argv['img-dir'].startsWith('.')
  ? Path.join(__dirname, argv['img-dir'])
  : argv['img-dir']);

// Development Server Settings
const frontEndDevServerOptions = {
  defaultConfig: require.resolve('@parcel/config-default'),
  entries: Path.join(__dirname, '../src/views/*.html'),
  outDir: Path.join(__dirname, '../dist'),
  publicUrl: '/',
  mode: 'development',
  cache: false,
  logLevel: 4,
  serve: {
    publicUrl: '/',
    port: devPort,
  },
  hot: {
    port: devPort,
    host: '/',
  },
};
const frontendDevServer = new Parcel(frontEndDevServerOptions);

// Stack up dev server
frontendDevServer.run();

if (
  !fs.existsSync(fullImageDir)
  || !fs.lstatSync(fullImageDir).isDirectory()
) {
  fs.mkdirSync(fullImageDir);
}

const server = express();

server.use('/img', express.static(argv['img-dir']));

// Create middleware to redirect requests
const parcelMiddleware = createProxyMiddleware({
  target: `http://localhost:${devPort}/`,
});

server.use('/', parcelMiddleware);

// Run your Express server
server.listen(servicePort, () => {
  console.log(`Listening to port ${servicePort}...`);
});
