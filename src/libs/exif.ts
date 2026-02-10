import ExifReader from 'exifreader';
import fs from 'node:fs/promises';
import { createLogger } from './pinologger.ts';

const log = createLogger('[EXIF]')

/*
 * returns 2023:05:27T18:52:01.000Z given 2023:05:27 18:52:01
 * exif creationTime and gps date+time are in this format
 * exif creationTime has no timezone, but we assume UTC for simplicity
*/
export const convertExifTimestampToDate = (exifTimestamp: string) => {
  const [date, time] = exifTimestamp.split(' ')
  const dateStr = date.replaceAll(':', '-')
  return new Date(`${dateStr}T${time}.000Z`)
}

export const getExifData = async (filepath: string) => {
  try {
    const fileBuffer = await fs.readFile(filepath);
    const tags = ExifReader.load(fileBuffer);
    const model = tags?.Model?.description ?? null
    const orientation = tags?.Orientation?.value ? Number(tags?.Orientation?.value) : null
    const captureTime = (tags?.DateTimeOriginal?.value as string[])?.[0] ?? null
    const captureDate = captureTime
      ? convertExifTimestampToDate(captureTime)
      : null

    // log.debug(`CAPTURE_DATE ${captureDate}`)

    const _isoCaptureDate = tags?.GPSDateStamp?.description ?? null
    const _isoCaptureTime = tags?.GPSTimeStamp?.description ?? null
    const gpsIsoCaptureDate = _isoCaptureDate && _isoCaptureTime ? convertExifTimestampToDate(`${_isoCaptureDate} ${_isoCaptureTime}`) : null
    return { tags, model, orientation, captureTime, captureDate, gpsIsoCreationDate: gpsIsoCaptureDate }
  } catch (error: any) {
    log.error(`GET_EXIF_ERROR: ${error}`)
    return null
  }
}
