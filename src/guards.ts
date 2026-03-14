import path from 'path';
import { Logger } from 'pino';
import { isIgnorePath } from './utils.ts';
import { PART, TRASHED_PREFIX } from './constants.ts';

export const isMedia = (name: string): boolean => {
  return isImage(name) || isVideo(name);
}

export const isImage = (name: string): boolean => {
  return /.+\.jpg$|jpeg$|png$/i.test(name);
}

export const isVideo = (name: string): boolean => {
  return /.+\.mp4$/i.test(name);
}

export const isIngestable = (params: { filePath: string, log: Logger }) => {
  const { filePath, log } = params;
  const filename = path.basename(filePath);

  if (isIgnorePath(filePath)) {
    log.warn(`SKIPPING_IGNORE_PREFIX_PATH ${filePath}`)
    return false
  }

  const containsHiddenPath = filePath.split(path.sep).some(f => f[0] === '.')
  if (containsHiddenPath) {
    log.warn(`SKIPPING_HIDDEN_FOLDER_OR_FILE ${filePath}`);
    return false
  }

  const ext = path.extname(filePath)
  if (ext.includes(PART)) {
    log.warn(`SKIPPING_PARTIAL_UPLOAD (${PART}}) ${filename}`);
    return false
  }

  if (filename.startsWith(TRASHED_PREFIX)) {
    log.warn(`SKIPPING_TRASHED_FILE (${TRASHED_PREFIX}) ${filename}`);
    return false
  }

  if (!isMedia(filename)) {
    log.warn(`SKIPPING_NON_MEDIA_FILE ${filePath}`)
    return false
  }

  return true
}