import ExifReader from 'exifreader';
import fs from 'node:fs/promises';
import { createLogger } from './pinologger.ts';
import { LocalDate, LocalDateTime, ZonedDateTime, ZoneOffset } from '@js-joda/core';
var jsJoda = require("@js-joda/core");
require("@js-joda/timezone");

const log = createLogger('[EXIF]')

/*
 * returns 2023:05:27T18:52:01.000Z given 2023:05:27 18:52:01
 * exif creationTime and gps date+time are in this format
 * exif creationTime has no timezone, but we assume UTC for simplicity
*/
export const convertExifTimestampToDate = (
  date: string,
  time: string,
  options: { convertFromLocalTZ: boolean } = { convertFromLocalTZ: false }) => {
  const dateStr = date.replaceAll(':', '-')

  if (options.convertFromLocalTZ) {
    const utcNow = ZonedDateTime.now(ZoneOffset.UTC)
    return 'ARGH LOCAL DATE'
    // assume local time, convert from local tz to GMT to have parity with other times in UTC

    formatter = jsJoda.DateTimeFormatter.ofPattern('yyyy:MM:dd HH:mm:ss');

    ZonedDateTime.of(
      jsJoda.LocalDateTime.parse(`${date} ${time}`, formatter),
      ZoneId.of('UTC')
    );
  } else {
    return new Date(`${dateStr}T${time}.000Z`)
  }
}

/**
 * captureDate: no TZ Date, use local TZ when gps datetime is not available
 * 
 */
export const getExifData = async (filepath: string) => {
  try {
    const fileBuffer = await fs.readFile(filepath);
    const tags = ExifReader.load(fileBuffer);
    const model = tags?.Model?.description ?? null
    const orientation = tags?.Orientation?.value ? Number(tags?.Orientation?.value) : null
    const captureTime = (tags?.DateTimeOriginal?.value as string[])?.[0] ?? null
    const [date, time] = captureTime.split(' ')
    const captureDate = captureTime
      ? convertExifTimestampToDate(date, time, { convertFromLocalTZ: true })
      : null

    // log.debug(`CAPTURE_DATE ${captureDate}`)
    // 1. image exif should be a date in the local timezone. Don't send it 
    // as GMT because then conversion on clients will be wrong. 
    /**
     * so
     * gmt time should be returned as a date
     * exif time should be parsed and converted to a gmt and returned
     */

    // 2. log the exif dates in use to verify the test works right
    // ffprobe, gps, exif only, no exif-using creation time. 

    const _isoCaptureDate = tags?.GPSDateStamp?.description ?? null
    const _isoCaptureTime = tags?.GPSTimeStamp?.description ?? null
    const gpsIsoCaptureDate = _isoCaptureDate && _isoCaptureTime ? convertExifTimestampToDate(_isoCaptureDate, _isoCaptureTime) : null
    return { tags, model, orientation, captureDate, captureTime, gpsIsoCreationDate: gpsIsoCaptureDate }
  } catch (error: any) {
    log.error(`GET_EXIF_ERROR: ${error}`)
    return null
  }
}
