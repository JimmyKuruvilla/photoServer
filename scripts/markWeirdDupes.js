/*
  Detect and print duplicates of the form:
  230509-PXL_20230509_174012190.jpg
  vs
  PXL_20230509_174012190.jpg

  This problem exists between Feb 28 2023 and May 27 2023
  It has not been corrected on S3
  The files have been marked for deletion via the eventual purge script. 
*/

const fs = require('fs');
const path = require('path');
const { recursiveTraverseDir } = require('../src/listings');
const LEADING_SIX_DIGITS_DASH_RE = /^\d{6}\-/;
const { TABLES } = require('../src/constants');
const { dockerDb, localDb } = require('../db/initDb.js');
const db = localDb();

const detectDupes = async (nodePath) => {
  const dirname = path.dirname(nodePath)
  const filename = path.basename(nodePath);
  const simpleFilename = filename.replace(LEADING_SIX_DIGITS_DASH_RE, '')
  
  if (LEADING_SIX_DIGITS_DASH_RE.test(filename) && fs.existsSync(path.join(dirname, simpleFilename))) {
    console.log(`marking duplicate for deletion ${filename}`)
    const dbRes = await db(TABLES.IMAGES)
      .select('*')
      .where({ path: nodePath })
      .update({ marked: true });

    fs.appendFileSync('filesToDelete.csv', nodePath + '\n');
  }
}

(async () => {
  const sourceDir = process.argv[2];
  if (!sourceDir) {
    throw new Error('Need source dir');
  }

  const count = await recursiveTraverseDir(
    sourceDir,
    detectDupes
  );

  console.log(`files seen ${count}`);
  process.exit();
})();
