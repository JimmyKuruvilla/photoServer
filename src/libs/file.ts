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

// note: always uses jpg mime type
export const createDataUriFromFilePath = async (filepath: string): Promise<string> => {
  const buffer = await fs.readFile(filepath)
  const base64 = buffer.toString('base64');
  const mime = 'image/jpeg'
  return `data:${mime};base64,${base64}`;
};
