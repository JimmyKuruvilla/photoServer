import { isPic } from '../../src/guards.ts';
import createImageThumbnail from '../../src/libs/image-thumbnail/image-thumbnail.ts';
import { log } from './log.ts';

export const genB64Thumbnail = async (fullPath: string, options = { percentage: 10, responseType: 'base64', jpegOptions: { force: false, quality: 20 } }) => {
  try {
    let thumbnail = 'data:image/png;base64,';
    thumbnail += await createImageThumbnail(fullPath, options as any);
    return thumbnail;
  } catch (e) {
    log(`INGEST::ERROR thumbnail generation: ${e}`);
    return;
  }
}

export const logThumbnail = (filepath: string, thumbnail: string) => {
  if (isPic(filepath)) { log(`INGEST::THUMBNAIL ${thumbnail.slice(-50)}`); }
}