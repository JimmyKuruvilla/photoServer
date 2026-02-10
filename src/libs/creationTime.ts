import { stat } from 'fs/promises';
import { isImage, isVideo } from '../guards.ts';
import { getExifData } from './exif.ts';
import { getFFProbeData } from './ffprobe.ts';
import { createLogger } from './pinologger.ts';
const log = createLogger('[MEDIA_CREATION_TIME]')

/**
 * Returns a UTC Date of the creation time of the file at filepath
 * images uses exif: use gps iso date if available or non-tz timestamp pretending to be UTC if not
 * video uses ffprobe
 * falls back to file creation time
 */
export const getMediaCaptureDate = async (filePath: string): Promise<Date> => {
  let creationTime;

  if (isImage(filePath)) {
    const exifData = await getExifData(filePath)
    creationTime = exifData?.gpsIsoCreationDate ?? exifData?.captureDate
    if (creationTime) {
      return creationTime
    }
  }

  if (isVideo(filePath)) {
    const ffResult = await getFFProbeData(filePath)
    if (ffResult?.creationTime) {
      return ffResult.creationTime
    }
  }

  const stats = await stat(filePath)
  return stats.birthtime
}
// test ingestion and see how this works. 