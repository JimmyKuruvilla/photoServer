import ExifReader from 'exifreader';
import fs from 'node:fs/promises';

export const getExifData = async (filepath: string) => {
  const fileBuffer = await fs.readFile(filepath);
  return ExifReader.load(fileBuffer);
}