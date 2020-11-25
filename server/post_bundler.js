const path = require('path');
const fs = require('fs').promises;
const { promisify } = require('util');
const crypto = require('crypto');

const { map, chain, forEach } = require('lodash');
const filenamify = require('filenamify');
const unusedFilename = require('unused-filename');
const strftime = require('strftime');

const exec = promisify(require('child_process').exec);

const TMP_FOLDER_PREFIX = '_tmp_';
const IMG_FOLDER_PATH = '/img';
const DOC_FILENAME = 'document.md';
const PARSED_DOC_FILENAME = 'document.xml';
const META_FILENAME = 'meta.json';

const TIMESTAMP_OUTPUT_FORMAT = '%Y%m%d_%H%M%S%z';
const TIMESTAMP_RESPONSE_FORMAT = '%Y-%m-%d %H:%M:%S %z';

async function bundlePost(
  imgDir,
  outDir,
  rawDocument,
  parsedDocument,
  docMeta,
) {
  // Below is our current file structure:
  // _tmp_SOMEHASH
  // |_ document.md
  // |_ document.xml
  // |_ meta.json
  // |_ img
  //   |_ image-alias-1.jpg
  //   |_ image-alias-2.jpg
  //   |_ ...

  // Step 1: Create temporary folder as needed
  const hashed = crypto.createHash('md5').update(rawDocument, 'utf8').digest('hex');
  const tmpFolderPath = path.join(outDir, `${TMP_FOLDER_PREFIX}${hashed}`);
  const imageFolderPath = path.join(tmpFolderPath, IMG_FOLDER_PATH);

  try {
    const dirInfo = await fs.stat(imageFolderPath);
    if (!dirInfo.isDirectory()) {
      await fs.mkdir(imageFolderPath, { recursive: true });
    }
  } catch (e) {
    if (e.code === 'ENOENT') {
      await fs.mkdir(imageFolderPath, { recursive: true });
    } else {
      throw e;
    }
  }

  // Step 2: Copy images and save document/meta to the temp directory
  const { aliasMapping, documentTitle } = docMeta;
  const docOutPath = path.join(tmpFolderPath, DOC_FILENAME);
  const parsedDocOutPath = path.join(tmpFolderPath, PARSED_DOC_FILENAME);
  const metaOutPath = path.join(tmpFolderPath, META_FILENAME);

  // Clone the original mapping to another object, then modify docMeta
  // through aliasMapping.
  const aliasPathMapping = { ...aliasMapping };
  forEach(aliasMapping, (imgPath, alias) => {
    aliasMapping[alias] = `${alias}${path.extname(imgPath)}`;
  });

  const docWriteOperation = fs.writeFile(
    docOutPath, rawDocument, { encoding: 'utf8' },
  );
  const parsedDocWriteOperation = fs.writeFile(
    parsedDocOutPath, parsedDocument, { encoding: 'utf8' },
  );
  const metaWriteOperation = fs.writeFile(
    metaOutPath, JSON.stringify(docMeta, null, 2), { encoding: 'utf8' },
  );

  // We need to apply allSettled() instead of all() in order to make sure
  // cleanup will start right after all the write/copy attempts complete,
  // no matter resolved or failed.
  const fileCreationResult = await Promise.allSettled(chain(
    [docWriteOperation, parsedDocWriteOperation, metaWriteOperation],
    map(aliasPathMapping, (imgPath, alias) => {
      const fullSourceImgPath = path.join(imgDir, imgPath);
      const outImgPath = path.join(
        imageFolderPath, `${alias}${path.extname(imgPath)}`,
      );
      return fs.copyFile(fullSourceImgPath, outImgPath);
    }),
  ));

  fileCreationResult.forEach(async (result) => {
    if (result.status === 'rejected') {
      await fs.rmdir(tmpFolderPath, { force: true, recursive: true });
      throw result.reason;
    }
  });

  // Step 3: Zip and archive the content, then remove temp folder.
  const targetFileName = filenamify(
    `${documentTitle}_${strftime(TIMESTAMP_OUTPUT_FORMAT)}.tgz`,
    { replacement: '_' },
  )
    .replace(/\s/g, '_');

  const targetFilePath = await unusedFilename(path.join(outDir, targetFileName));
  try {
    // Simple explanation:
    //  - Create a zipped (gzip as default) archive
    //  - Move to 'tmpFolderPath' before creating archive.
    //  - Archive all the files and folders under 'tmpFolderPath'.
    //  - Pop off parent directory by 1 layer, here this means to get rid of
    //    '.' directory, so that we can access 'document.md' without adding
    //    './' prefix.
    await exec(
      `tar czf ${targetFilePath} -C ${tmpFolderPath} --strip-components 1 .`,
    );
    await fs.rmdir(tmpFolderPath, { force: true, recursive: true });
    return {
      timeStamp: strftime(TIMESTAMP_RESPONSE_FORMAT),
      outputDir: targetFilePath,
    };
  } catch (e) {
    await fs.rmdir(tmpFolderPath, { force: true, recursive: true });
    throw e;
  }
}

module.exports = bundlePost;
