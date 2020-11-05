import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

import { map, chain } from 'lodash';
import filenamify from 'filenamify';
import unusedFilename from 'unused-filename';
import strftime from 'strftime';
import tar from 'tar';

const TMP_FOLDER_PREFIX = '_tmp_';
const IMG_FOLDER_PATH = '/img';
const DOC_FILENAME = 'document.md';
const META_FILENAME = 'meta.json';

const TIMESTAMP_OUTPUT_FORMAT = '%Y_%m_%d_%H_%M_%S_%Z';
const TIMESTAMP_RESPONSE_FORMAT = '%Y-%m-%d %H:%M:%S %Z';

async function bundlePost(imgDir, outDir, rawDocument, docMeta) {
  // Below is our current file structure:
  // _tmp_SOMEHASH
  // |_ document.md
  // |_ meta.json
  // |_ img
  //   |_ image-1.jpg
  //   |_ image-2.jpg
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
  const { aliasMapping, title } = docMeta;
  const docOutPath = path.join(tmpFolderPath, DOC_FILENAME);
  const metaOutPath = path.join(tmpFolderPath, META_FILENAME);

  try {
    const docWriteOperation = fs.writeFile(
      docOutPath, rawDocument, { encoding: 'utf8' },
    );
    const metaWriteOperation = fs.writeFile(
      metaOutPath, docMeta.toString(), { encoding: 'utf8' },
    );
    await Promise.all(chain(
      [docWriteOperation, metaWriteOperation],
      map(aliasMapping, (imgPath, alias) => {
        const fullSourceImgPath = path.join(imgDir, imgPath);
        const outImgPath = path.join(
          imageFolderPath, `${alias}${path.extname(imgPath)}`,
        );
        return fs.copyFile(fullSourceImgPath, outImgPath);
      }),
    ));
  } catch (e) {
    await fs.rm(tmpFolderPath, { force: true, recursive: true });
    throw e;
  }

  // Step 3: Zip and archive the content, then remove temp folder.
  const targetFileName = filenamify(
    `${title}_${strftime(TIMESTAMP_OUTPUT_FORMAT)}.tgz`,
  );

  const targetFilePath = unusedFilename(path.join(outDir, targetFileName));
  try {
    await tar.c(
      {
        gzip: true,
        file: targetFilePath,
      },
      [tmpFolderPath],
    );
    await fs.rm(tmpFolderPath, { force: true, recursive: true });
    return {
      timeStamp: strftime(TIMESTAMP_RESPONSE_FORMAT),
      outputDir: targetFilePath,
    };
  } catch (e) {
    await fs.rm(tmpFolderPath, { force: true, recursive: true });
    throw e;
  }
}

export default bundlePost;
