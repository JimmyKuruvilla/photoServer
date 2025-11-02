import fs from 'node:fs/promises';

export const doesFileExist = async (filePath: string) => {
  try {
    await fs.access(filePath);
    return true;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // console.log(`File "${filePath}" does not exist.`);
    } else {
      // console.error(`Error checking file "${filePath}":`, error);
    }
    return false;
  }
}
