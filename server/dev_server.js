#!/usr/bin/env node
/* eslint-disable import/no-extraneous-dependencies */
/* ^^ We're using this for development now, so simply skip the warnings here */
const Path = require('path');
const fs = require('fs');
const process = require('process');
const { exec } = require('child_process');
const https = require('https');

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const postBundler = require('./post_bundler');

// Argument Setings
const { argv } = yargs(hideBin(process.argv))
  .usage('Usage: $0 [options]')
  .example(
    '$0 --dev-port 4000 --backend-port 4001 --img-dir ./imgs --out-dir ./result',
    'Route frontend-dev server requests to port 4000, service server at port '
    + '4001, save output archives to "result" folder under root directory, '
    + 'and using "img" folder to serach for images under root directory.',
  )
  .example(
    '$0 -f 4000 -p 4001 -d ./imgs -o ./result',
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
    'parcel-options': {
      describe: (
        'Additional options used to initialize parcel development server.'
      ),
      type: 'string',
      nargs: 1,
      default: '',
    },
    'ssl-key': {
      describe: (
        'Path to SSL key file.'
      ),
      type: 'string',
      nargs: 1,
      default: '',
    },
    'ssl-cert': {
      describe: (
        'Path to SSL cert file.'
      ),
      type: 'string',
      nargs: 1,
      default: '',
    },
  });

const devPort = argv['dev-port'];
const servicePort = argv['backend-port'];

const sslKey = fs.readFileSync(argv['ssl-key']);
const sslCert = fs.readFileSync(argv['ssl-cert']);

const fullImageDir = Path.normalize(argv['img-dir'].startsWith('.')
  ? Path.join(__dirname, argv['img-dir'])
  : argv['img-dir']);
const fullOutputDir = Path.normalize(argv['out-dir'].startsWith('.')
  ? Path.join(__dirname, argv['out-dir'])
  : argv['out-dir']);

// Force create directory as needed
if (
  !fs.existsSync(fullImageDir)
  || !fs.lstatSync(fullImageDir).isDirectory()
) {
  fs.mkdirSync(fullImageDir);
}

// Start parcel dev server as child process and pipe output to parent
process.env.FORCE_COLOR = 2; // Enable color
const parcelTargetPath = Path.join(__dirname, '../src/views/editor.html');
const parcelServer = exec(
  `npx parcel "${parcelTargetPath}" --no-cache --port ${devPort} ${argv['parcel-options']}`,
  {},
  (error) => {
    if (error) {
      process.stdout.write('Parcel dev server terminated with error:\n');
      process.stdout.write(error);
    }
    process.stdout.write('Parcel dev server terminated successfully.\n');
  },
);
parcelServer.stdout.pipe(process.stdout);
parcelServer.stderr.pipe(process.stderr);

// Start server and redirect requests
const server = express();
server.use(express.json());

const parcelMiddleware = createProxyMiddleware({
  target: `http://localhost:${devPort}/`,
});
server.use('/img', express.static(argv['img-dir']));

server.post('/bundle_document', async (req, res) => {
  const { rawDocument, parsedDocument, documentMeta } = req.body;
  const result = await postBundler(
    fullImageDir, fullOutputDir, rawDocument, parsedDocument, documentMeta,
  );
  res.json(result);
});

// Redirect others to Parcel service
server.use('/', parcelMiddleware);

const httpServer = https.createServer({ key: sslKey, cert: sslCert }, server);

const serverHandle = httpServer.listen(servicePort, () => {
  process.stdout.write(`Listening to port ${servicePort}...\n`);
});

// Terminate Parcel server first when receiving Ctrl-C
process.on('SIGINT', () => {
  serverHandle.close(() => {
    process.stdout.write('Terminating Parcel dev server...\n');
    parcelServer.kill('SIGINT');
  });
});
