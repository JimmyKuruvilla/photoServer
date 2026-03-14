import { copyFile } from 'fs/promises';
import fs from 'node:fs/promises';
import path from 'path';
import { createLogger } from './pinologger.ts';
const renameAsync = fs.rename;
const mkdir = fs.mkdir;
const log = createLogger('[FILE]');

export const doesFileExist = async (filePath: string) => {
  try {
    await fs.access(filePath);
    return true;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      log(`File "${filePath}" does not exist.`);
    } else {
      log(`Error checking file "${filePath}": ${error}`);
    }
    return false;
  }
}

// note: always uses jpg mime type
export const createDataUriFromFilePath = async (filepath: string): Promise<string> => {
  const buffer = await fs.readFile(filepath)
  const base64 = buffer.toString('base64');
  const mime = 'image/jpeg'
  return `data:${mime};base64,${base64}`;
};

const createDir = async (path: string) => {
  try {
    await mkdir(path);
  } catch (error: any) {
    if (error.code === 'EEXIST') {
      log.info(`CREATE_DIR__DIRECTORY_ALREADY_EXISTS ${path}`);
    } else {
      throw new Error(`CREATE_DIR__CANNOT_CREATE_DIR`, { cause: error });
    }
  }
};

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

const move = async (source: string, target: string) => {
  log.info(`MOVE_TO_DATE from ${source} to \n ${target}`);
  return renameAsync(source, target);
};

export const moveToTarget = async (absSourcePath: string, targetPath: string, targetFolderName: string, targetFilePath: string) => {
  try {
    await createDir(path.join(targetPath, targetFolderName));
    await move(absSourcePath, targetFilePath);
    log.info(`MOVE ${absSourcePath} to ${targetFilePath}`);
    return targetFilePath;
  } catch (error: any) {
    throw new Error(`MOVE_TO_DATE`, { cause: error });
  }
};

export const copyToTarget = async (absSourcePath: string, targetPath: string, targetFolderName: string, targetFilePath: string) => {
  try {
    await createDir(path.join(targetPath, targetFolderName));
    await copyFile(absSourcePath, targetFilePath);
    log.info(`COPY ${absSourcePath} to ${targetFilePath}`);
    return targetFilePath;
  } catch (error: any) {
    throw new Error(`COPY_TO_DATE`, { cause: error });
  }
};

export const deleteTarget = async (filepath: string) => {
  try {
    log.info(`DELETE ${filepath}`);
    await fs.unlink(filepath);
    return;
  } catch (error: any) {
    throw new Error(`DELETE`, { cause: error });
  }
};
