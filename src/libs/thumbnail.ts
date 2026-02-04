import createImageThumbnail from './image-thumbnail.ts';
import { createLogger } from './pinologger.ts';
const log = createLogger('[THUMBNAIL]')

export const genB64Thumbnail = async (fullPath: string, options = { percentage: 10, responseType: 'base64', jpegOptions: { force: false, quality: 20 } }) => {
  try {
    let thumbnail = 'data:image/png;base64,';
    thumbnail += await createImageThumbnail(fullPath, options as any);
    return thumbnail;
  } catch (error) {
    log.info(`THUMBNAIL::GENERATION_ERROR: ${error}`);
    return null;
  }
}