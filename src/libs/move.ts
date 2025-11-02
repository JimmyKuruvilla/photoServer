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

import fs from 'node:fs/promises';
import path from 'path';
import { log } from './log.ts';
const renameAsync = fs.rename;
const mkdir = fs.mkdir;

const createDir = async (path: string) => {
  try {
    await mkdir(path)
  }
  catch (error: any) {
    if (error.code === 'EEXIST') {
      log(`CREATE_DIR::DIRECTORY_ALREADY_EXISTS ${path}`);
    } else {
      log(`CREATE_DIR::CANNOT_CREATE_DIR ${error.message}`);
    }
  }
}

const move = async (source: string, target: string) => {
  log(`MOVE_FILE::MOVE_TO_DATE from ${source} to \n ${target}`);
  return renameAsync(source, target);
}

export const moveToTarget = async (absSourcePath: string, targetPath: string, targetFolderName: string, targetFilePath: string) => {
  try {
    await createDir(path.join(targetPath, targetFolderName))
    await move(absSourcePath, targetFilePath);
    log(`MOVE_FILE::${absSourcePath} to ${targetFilePath}`);
    return targetFilePath;
  } catch (error: any) {
    log(`MOVE_PIC::MOVE_TO_DATE_ERROR ${error.message}`);
    return null;
  }
}