/*
  read all files from /mnt/backup/media/__dropoff and move to a date formatted target directory
  setup folder sync pro on phones with following settings:
  - to ignore remote deletions/sync only if source modified (can move/delete on remote)
  - don't sync source deletions (can delete from phone)
  - don't sync hidden
  - sync sub folders
  - never overwrite old files
  - if both have been modified, use local
  - use temp-file scheme
 */

/*
  3 sources for creation time:
  1. file name (PXL_20230528_175134797) is is in UTC
  2. file system creation time (May 28 12:51) is local time
  3. probe data
    a. exif (2023:05:27 18:52:01) is in local time and doesn't need converting to local time
    b. ffprobe (2023-05-24T22:39:31.000000Z) is in UTC and needs convertime to local time
  Need to adjust to local time before sorting into folders, otherwise will have date errors across day boundaries

  Possible Improvements - fall back to 1 and then 2 if 3 is not available. 
*/
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const renameAsync = promisify(fs.rename);
const readFile = promisify(fs.readFile);
const ExifReader = require('exifreader');
const ffprobe = require('ffprobe');
const ffprobeStatic = require('ffprobe-static');
const { recursiveTraverseDir } = require('../src/listings');
const { isPic, isVideo } = require('../src/guards');

// returns 2023-05-24 given UTC date
const formatToLocalDateString = (isoDateStr) => {
  const [month, date, year] = new Date(isoDateStr).toLocaleDateString().split('/');
  return `${year}-${month.padStart(2, '0')}-${date.padStart(2, '0')}`;
}

const createDatePath = (targetDir, date, filename) => `${path.join(targetDir, date, filename)}`;

const isHidden = (filename) => filename[0] === '.'

const move = async (source, target) => {
  console.log(source, `moving/renaming to ${target}`)
  // await renameAsync(fullAbsSourcePath, fullAbsTargetPath);
}

const movePic = async (fullAbsSourcePath, targetDir, filename) => {
  try {
    const fileBuffer = await readFile(fullAbsSourcePath);
    const tags = await ExifReader.load(fileBuffer);

    // converts from '2023:05:27 18:52:01' to 2023-05-27
    const creationTime = tags?.DateTimeOriginal?.value?.[0];

    if (creationTime) {
      const formattedDate = creationTime.split(' ')[0].replaceAll(':', '-');
      const fullAbsTargetPath = createDatePath(targetDir, formattedDate, filename);
      await move(fullAbsSourcePath, fullAbsTargetPath);
    } else {
      console.log('EXIFREADER_NO_CREATION_TIME, cannot move file', fullAbsSourcePath)
    }
  } catch (e) {
    console.log('EXIFREADER_ERROR', e.message);
  }
}

const moveVideo = async (fullAbsSourcePath, targetDir, filename) => {
  try {
    const info = await ffprobe(fullAbsSourcePath, { path: ffprobeStatic.path })
    // converts to from '2023-05-24T22:39:31.000000Z' to 2023-05-24
    const creationTime = info?.streams?.[0]?.tags?.creation_time;

    if (creationTime) {
      const formattedDate = formatToLocalDateString(creationTime);
      const fullAbsTargetPath = createDatePath(targetDir, formattedDate, filename);

      await move(fullAbsSourcePath, fullAbsTargetPath);
    } else {
      console.log('FFPROBE_NO_CREATION_TIME, cannot move file', fullAbsSourcePath)
    }
  } catch (e) {
    console.log('FFPROBE_ERROR', e.message);
  }
}

const moveFileByCreationDate = (targetDir) => async (fullAbsSourcePath) => {
  const filename = path.basename(fullAbsSourcePath);
  if (!isHidden(filename)) {
    if (isPic(filename)) {
      await movePic(fullAbsSourcePath, targetDir, filename);
    } else if (isVideo(filename)) {
      await moveVideo(fullAbsSourcePath, targetDir, filename);
    } else { console.log('NOT_A_MEDIA_FILE, skipping') }
  } else {
    console.log('SKIPPING_HIDDEN_FILE', fullAbsSourcePath)
  }
}


(async () => {
  const sourceDir = process.argv[2];
  const targetDir = process.argv[3];

  if (!sourceDir || !targetDir) {
    throw new Error('Need both source and target dirs');
  }

  const count = await recursiveTraverseDir(
    sourceDir,
    moveFileByCreationDate(targetDir)
  );

  console.log(`files seen ${count}`);
  process.exit();
})();
