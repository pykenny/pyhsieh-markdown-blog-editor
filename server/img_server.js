#!/usr/bin/env node
/* eslint-disable import/no-extraneous-dependencies */
/* ^^ We're using this for development now, so simply skip the warnings here */
const Path = require('path');
const fs = require('fs');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
// const apis = require('../src/js/apis');

// Argument Setings
const { argv } = yargs(hideBin(process.argv))
  .usage('Usage: $0 [options]')
  .example(
    '$0 --dev-port 4000 --backend-port 4001 --img-dir ./imgs',
    'Route frontend-dev server requests to port 4000, service server at port 4001, and using "img" folder under root directory.',
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

// Force create directory as needed
if (
  !fs.existsSync(fullImageDir)
  || !fs.lstatSync(fullImageDir).isDirectory()
) {
  fs.mkdirSync(fullImageDir);
}

// Start server and redirect requests
const server = express();
const parcelMiddleware = createProxyMiddleware({
  target: `http://localhost:${devPort}/`,
});
server.use('/img', express.static(argv['img-dir']));
server.use('/', parcelMiddleware);

server.listen(servicePort, () => {
  console.log(`Listening to port ${servicePort}...`);
});
