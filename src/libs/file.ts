import fs from 'node:fs/promises';
import { log } from './log.ts';

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
