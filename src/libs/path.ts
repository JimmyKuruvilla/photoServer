
import { stat } from 'fs/promises';
import path from 'path';
import { getFolderNameFromExifCreationTime, getFolderNameFromFFProbeCreationTime, getFolderNameFromFileStatBirthTime } from './date.ts';
import { getExifData } from './exif.ts';
import { getFFProbeData } from './ffprobe.ts';
import { log } from './log.ts';

export const generateTargetFolderNameFromCreationTime = async (absSourcePath: string) => {
  const stats = await stat(absSourcePath)
  const targetFolderName = getFolderNameFromFileStatBirthTime(stats.birthtime)
  log(`GEN_TARGET_PATH::NO_CREATION_TIME, USING_FILE_CREATION_TIME ${targetFolderName} ${absSourcePath}`)
  return targetFolderName;
}

export const generateTargetPathForImage = async (absSourcePath: string, targetPath: string) => {
  const filename = path.basename(absSourcePath);

  const exifData = await getExifData(absSourcePath)
  const creationTime = exifData?.creationTime
  let targetFolderName

  if (creationTime) {
    targetFolderName = getFolderNameFromExifCreationTime(creationTime);
    log(`GEN_TARGET_PATH::USING_EXIF_CREATION_TIME ${targetFolderName} ${absSourcePath}`)
  } else {
    targetFolderName = await generateTargetFolderNameFromCreationTime(absSourcePath)
  }

  return { targetFolderName, targetFilePath: path.join(targetPath, targetFolderName, filename) };
}

export const generateTargetPathForVideo = async (absSourcePath: string, targetPath: string) => {
  const filename = path.basename(absSourcePath);

  const info = await getFFProbeData(absSourcePath)
  let targetFolderName
  const creationTime = info?.streams?.[0]?.tags?.creation_time;

  if (creationTime) {
    targetFolderName = getFolderNameFromFFProbeCreationTime(creationTime);
    log(`GEN_TARGET_PATH::USING_EXIF_CREATION_TIME ${targetFolderName} ${absSourcePath}`)
  } else {
    targetFolderName = await generateTargetFolderNameFromCreationTime(absSourcePath)
  }

  return { targetFolderName, targetFilePath: path.join(targetPath, targetFolderName, filename) };
}