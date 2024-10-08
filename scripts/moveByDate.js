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

Currently does 3 and then 2 if data not available. 1 not attempted. 
*/
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const renameAsync = promisify(fs.rename);
const readFile = promisify(fs.readFile);
const mkdir = promisify(fs.mkdir);
const unlink = promisify(fs.unlink);
const stat = promisify(fs.stat);
const ExifReader = require('exifreader');
const ffprobe = require('ffprobe');
const ffprobeStatic = require('ffprobe-static');
const { isPic, isVideo } = require('../src/guards');
const { log } = require('./log');

// returns 2023-05-24 given UTC date
const formatToLocalDateString = (isoDateStr) => {
  const [month, date, year] = new Date(isoDateStr).toLocaleDateString().split('/');
  return `${year}-${month.padStart(2, '0')}-${date.padStart(2, '0')}`;
}

const createDatePath = (targetDir, date, filename) => `${path.join(targetDir, date, filename)}`;

const isHidden = (filename) => filename[0] === '.'

const createDir = async (path) => {
  try {
    await mkdir(path)
  }
  catch (e) {
    if (e.code === 'EEXIST') {
      log(`PIPELINE_CREATE_DIRECTORY_ALREADY_EXISTS ${path}`);
    } else {
      log(`PIPELINE_CREATE_DIRECTORY_CANNOT_CREATE_DIR ${e.message}`);
    }
  }
}

const move = async (source, target) => {
  log(`PIPELINE_MOVE_TO_DATE from ${source} to \n ${target}`);
  await renameAsync(source, target);
}

const movePic = async (fullAbsSourcePath, targetDir, filename) => {
  try {
    const fileBuffer = await readFile(fullAbsSourcePath);
    const tags = await ExifReader.load(fileBuffer);

    // converts from '2023:05:27 18:52:01' to 2023-05-27
    const exifCreationTime = tags?.DateTimeOriginal?.value?.[0];

    let formattedDate;
    if (exifCreationTime) {
      formattedDate = exifCreationTime.split(' ')[0].replaceAll(':', '-');
    } else {
      // 2023-08-25T09:10:05.832Z to 2023-08-25
      const stats = await stat(fullAbsSourcePath)
      formattedDate = stats.birthtime.toISOString().split('T')[0]
      log(`PIPELINE_MOVE_TO_DATE_EXIFREADER_NO_CREATION_TIME, USING_FILE_CREATION_TIME ${formattedDate} ${fullAbsSourcePath}`)
    }

    await createDir(path.join(targetDir, formattedDate));
    const fullAbsTargetPath = createDatePath(targetDir, formattedDate, filename);
    await move(fullAbsSourcePath, fullAbsTargetPath);
    return fullAbsTargetPath;
  } catch (e) {
    log(`PIPELINE_MOVE_TO_DATE_ERROR ${e.message}`);
    return null;
  }
}

const moveVideo = async (fullAbsSourcePath, targetDir, filename) => {
  try {
    const info = await ffprobe(fullAbsSourcePath, { path: ffprobeStatic.path })
    // converts to from '2023-05-24T22:39:31.000000Z' to 2023-05-24
    const creationTime = info?.streams?.[0]?.tags?.creation_time;

    let formattedDate
    if (creationTime) {
      formattedDate = formatToLocalDateString(creationTime);
    } else {
      // 2023-08-25T09:10:05.832Z to 2023-08-25
      const stats = await stat(fullAbsSourcePath)
      formattedDate = stats.birthtime.toISOString().split('T')[0]
      log(`PIPELINE_MOVE_TO_DATE_FFPROBE_NO_CREATION_TIME, USING_FILE_CREATION_TIME ${formattedDate} ${fullAbsSourcePath}`);
    }

    await createDir(path.join(targetDir, formattedDate));
    const fullAbsTargetPath = createDatePath(targetDir, formattedDate, filename);
    await move(fullAbsSourcePath, fullAbsTargetPath);
    return fullAbsTargetPath;
  } catch (e) {
    log(`PIPELINE_MOVE_TO_DATE_FFPROBE_ERROR ${e.message}`);
    return null;
  }
}

const moveFileByCreationDate = (targetDir) => async (fullAbsSourcePath) => {
  const filename = path.basename(fullAbsSourcePath);
  if (!isHidden(filename)) {
    if (isPic(filename)) {
      return movePic(fullAbsSourcePath, targetDir, filename);
    } else if (isVideo(filename)) {
      return moveVideo(fullAbsSourcePath, targetDir, filename);
    } else {
      log(`NOT_A_MEDIA_FILE, skipping`)
      return null;
    }
  } else {
    if (filename.startsWith('.trashed')) {
      log(`DELETING_TRASHED_FILE ${filename}`);
      await unlink(fullAbsSourcePath)
    } else {
      log(`SKIPPING_HIDDEN_FILE ${filename}`);
    }
    return null;
  }
}

module.exports = {
  moveFileByCreationDate
}
