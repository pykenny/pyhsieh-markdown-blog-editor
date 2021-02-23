#!/usr/bin/env node
/* eslint-disable import/no-extraneous-dependencies */
/* ^^ We're using this for development now, so simply skip the warnings here */
const Path = require('path');
const fs = require('fs');
const process = require('process');
const https = require('https');

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const express = require('express');
const dotenv = require('dotenv');

const postBundler = require('./post_bundler');

dotenv.config();

const {
  SSL_KEY_PATH: sslKeyPath,
  SSL_CERT_PATH: sslCertPath,
} = process.env;

// Argument Setings
const { argv } = yargs(hideBin(process.argv))
  .usage('Usage: $0 [options]')
  .example(
    '$0 --port 4001 --img-dir ./imgs --out-dir ./result',
    'Run the server at 4001, save output archives to "result" folder under root directory, '
    + 'and using "img" folder to serach for images under root directory.',
  )
  .example(
    '$0 -p 4001 -p ./imgs -o ./result',
    'Do the same thing as above',
  )
  .options({
    port: {
      alias: 'p',
      describe: 'Port of the server.',
      type: 'number',
      nargs: 1,
      default: 4000,
    },
    'img-dir': {
      alias: 'd',
      describe: (
        'Directory for accessing image content. '
        + 'If you are using relative path, please note that the working '
        + 'directory is "server" folder under the root directory.'
      ),
      type: 'string',
      nargs: 1,
      default: Path.normalize(Path.join(__dirname, 'img')),
    },
    'out-dir': {
      alias: 'o',
      describe: (
        'Directory to save the bundled files. '
        + 'If you are using relative path, please note that the working '
        + 'directory is "server" folder under the root directory.'
      ),
      type: 'string',
      nargs: 1,
      default: Path.normalize(Path.join(__dirname, 'output')),
    },
  });

const servicePort = argv.port;

const fullImageDir = Path.normalize(argv['img-dir'].startsWith('.')
  ? Path.join(__dirname, argv['img-dir'])
  : argv['img-dir']);
const fullOutputDir = Path.normalize(argv['out-dir'].startsWith('.')
  ? Path.join(__dirname, argv['out-dir'])
  : argv['out-dir']);
const siteStaticDir = Path.join(__dirname, '../dist');

// Force create directory as needed
if (
  !fs.existsSync(fullImageDir)
  || !fs.lstatSync(fullImageDir).isDirectory()
) {
  fs.mkdirSync(fullImageDir);
}

// Start server and redirect requests
const server = express();
server.use(express.json());
server.use('/', express.static(siteStaticDir));
server.use('/img', express.static(argv['img-dir']));

server.post('/bundle_document', async (req, res) => {
  const { rawDocument, parsedDocument, documentMeta } = req.body;
  const result = await postBundler(
    fullImageDir, fullOutputDir, rawDocument, parsedDocument, documentMeta,
  );
  res.json(result);
});

const sslKey = fs.readFileSync(sslKeyPath);
const sslCert = fs.readFileSync(sslCertPath);
const mainServer = https.createServer({ key: sslKey, cert: sslCert }, server);

mainServer.listen(servicePort, () => {
  process.stdout.write(`Listening to port ${servicePort}...\n`);
});
