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
import ExifReader from 'exifreader';
import ffprobe from 'ffprobe';
import ffprobeStatic from 'ffprobe-static';
import fs from 'node:fs/promises';
import path from 'path';
import { isPic, isVideo } from '../../src/guards.ts';
import { log } from './log.ts';
const renameAsync = fs.rename;
const readFile = fs.readFile;
const mkdir = fs.mkdir;
const stat = fs.stat;

// returns 2023-05-24 given UTC date
const formatToLocalDateString = (isoDateStr: string) => {
  const [month, date, year] = new Date(isoDateStr).toLocaleDateString().split('/');
  return `${year}-${month.padStart(2, '0')}-${date.padStart(2, '0')}`;
}

const createDatePath = (targetDir: string, date: string, filename: string) => `${path.join(targetDir, date, filename)}`;

const createDir = async (path: string) => {
  try {
    await mkdir(path)
  }
  catch (error: any) {
    if (error.code === 'EEXIST') {
      log(`INGEST::CREATE_DIRECTORY_ALREADY_EXISTS ${path}`);
    } else {
      log(`INGEST::CREATE_DIRECTORY_CANNOT_CREATE_DIR ${error.message}`);
    }
  }
}

const move = async (source: string, target: string) => {
  log(`INGEST::MOVE_TO_DATE from ${source} to \n ${target}`);
  await renameAsync(source, target);
}

const movePic = async (fullAbsSourcePath: string, targetDir: string, filename: string) => {
  try {
    const fileBuffer = await readFile(fullAbsSourcePath);
    const tags: any = await ExifReader.load(fileBuffer);

    // converts from '2023:05:27 18:52:01' to 2023-05-27
    const exifCreationTime = tags?.DateTimeOriginal?.value?.[0];

    let formattedDate;
    if (exifCreationTime) {
      formattedDate = exifCreationTime.split(' ')[0].replaceAll(':', '-');
    } else {
      // 2023-08-25T09:10:05.832Z to 2023-08-25
      const stats = await stat(fullAbsSourcePath)
      formattedDate = stats.birthtime.toISOString().split('T')[0]
      log(`INGEST::MOVE_TO_DATE_EXIFREADER_NO_CREATION_TIME, USING_FILE_CREATION_TIME ${formattedDate} ${fullAbsSourcePath}`)
    }

    await createDir(path.join(targetDir, formattedDate));
    const fullAbsTargetPath = createDatePath(targetDir, formattedDate, filename);
    await move(fullAbsSourcePath, fullAbsTargetPath);
    return fullAbsTargetPath;
  } catch (error: any) {
    log(`INGEST::MOVE_TO_DATE_ERROR ${error.message}`);
    return null;
  }
}

const moveVideo = async (fullAbsSourcePath: string, targetDir: string, filename: string) => {
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
      log(`INGEST::MOVE_TO_DATE_FFPROBE_NO_CREATION_TIME, USING_FILE_CREATION_TIME ${formattedDate} ${fullAbsSourcePath}`);
    }

    await createDir(path.join(targetDir, formattedDate));
    const fullAbsTargetPath = createDatePath(targetDir, formattedDate, filename);
    await move(fullAbsSourcePath, fullAbsTargetPath);
    return fullAbsTargetPath;
  } catch (error: any) {
    log(`INGEST::MOVE_TO_DATE_FFPROBE_ERROR ${error.message}`);
    return null;
  }
}

export const moveFileByCreationDate = (targetPath: string) => async (fullAbsSourcePath: string) => {
  const filename = path.basename(fullAbsSourcePath);
  if (isPic(filename)) {
    return movePic(fullAbsSourcePath, targetPath, filename);
  } else if (isVideo(filename)) {
    return moveVideo(fullAbsSourcePath, targetPath, filename);
  } else {
    log(`MOVE_FILE::NOT_A_MEDIA_FILE, skipping`)
    return null;
  }
}
