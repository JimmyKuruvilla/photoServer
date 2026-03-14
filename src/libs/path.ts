
import path from 'path';
import { formatToLocalDateString } from './date.ts';
import { createLogger } from './pinologger.ts';
const log = createLogger('[GEN_TARGET_PATH]')

export const generateTargetPath = (absSourcePath: string, targetPath: string, captureDate: Date) => {
  try {
    const filename = path.basename(absSourcePath);
    const targetFolderName = formatToLocalDateString(captureDate);

    return { targetFolderName, targetFilePath: path.join(targetPath, targetFolderName, filename) };
  } catch (error) {
    throw new Error(`GEN_TARGET_PATH`, { cause: error })
  }
}