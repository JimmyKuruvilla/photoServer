import * as jsJoda from '@js-joda/core';
import { ZonedDateTime, ZoneOffset } from '@js-joda/core';
import '@js-joda/timezone';
import ExifReader from 'exifreader';
import fs from 'node:fs/promises';
import { createLogger } from './pinologger.ts';

const log = createLogger('[EXIF]')

const formatter = jsJoda.DateTimeFormatter.ofPattern('yyyy:MM:dd HH:mm:ss');
/*
 * given date (2023:05:27) and time (18:52:01) returns a UTC Date
 * exif captureTime and gps date+time are in this colon format
 * but exif creationTime has no timezone, so assume it was taken in system local timezone and convert to UTC
 * return gps date time as is in UTC
 * IMP: exif timezone for original date also exists and could be used.
*/
export const convertTimestampToDate = (
  date: string,
  time: string,
  options: { convertFromSystemTZ: boolean } = { convertFromSystemTZ: false }) => {

  if (options.convertFromSystemTZ) {
    const local = ZonedDateTime.of(
      jsJoda.LocalDateTime.parse(`${date} ${time}`, formatter),
      ZoneOffset.SYSTEM
    );
    const utc = local.withZoneSameInstant(ZoneOffset.UTC)
    return jsJoda.convert(utc).toDate()
  } else {
    const dateStr = date.replaceAll(':', '-')
    return new Date(`${dateStr}T${time}.000Z`)
  }
}

export const getExifData = async (filepath: string) => {
  try {
    const fileBuffer = await fs.readFile(filepath);
    const tags = ExifReader.load(fileBuffer);
    const model = tags?.Model?.description ?? null
    const orientation = tags?.Orientation?.value ? Number(tags?.Orientation?.value) : null
    const exifDateTime = (tags?.DateTimeOriginal?.value as string[])?.[0] ?? null
    let captureDate = null;

    if (exifDateTime) {
      const [date, time] = exifDateTime.split(' ')
      captureDate = date && time
        ? convertTimestampToDate(date, time, { convertFromSystemTZ: true })
        : null
    }

    const _isoCaptureDate = tags?.GPSDateStamp?.description ?? null
    const _isoCaptureTime = tags?.GPSTimeStamp?.description ?? null
    const gpsIsoCaptureDate = _isoCaptureDate && _isoCaptureTime ? convertTimestampToDate(_isoCaptureDate, _isoCaptureTime) : null
    return { tags, model, orientation, captureDate, gpsIsoCreationDate: gpsIsoCaptureDate }
  } catch (error: any) {
    log.error(`GET_EXIF_ERROR: ${error}`)
    return null
  }
}
