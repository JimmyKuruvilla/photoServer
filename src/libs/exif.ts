import ExifReader from 'exifreader';
import fs from 'node:fs/promises';

export const getExifData = async (filepath: string) => {
  const fileBuffer = await fs.readFile(filepath);
  const tags = ExifReader.load(fileBuffer);
  const model = tags?.Model?.description ?? null
  const orientation = tags?.Orientation?.value ? Number(tags?.Orientation?.value) : null

  return { tags, model, orientation }
}