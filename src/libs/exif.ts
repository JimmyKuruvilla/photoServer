import ExifReader from 'exifreader';
import fs from 'node:fs/promises';
import { log } from './log.ts';

export const getExifData = async (filepath: string) => {
  try {
    const fileBuffer = await fs.readFile(filepath);
    const tags = ExifReader.load(fileBuffer);
    const model = tags?.Model?.description ?? null
    const orientation = tags?.Orientation?.value ? Number(tags?.Orientation?.value) : null
    const creationTime = (tags?.DateTimeOriginal?.value as string[])?.[0] ?? null
    return { tags, model, orientation, creationTime }
  } catch (error: any) {
    log(`GET_EXIF_ERROR: ${error}`)
    return null
  }
}
