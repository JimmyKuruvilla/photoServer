import ffprobe, { FFProbeResult } from 'ffprobe';
import ffprobeStatic from 'ffprobe-static';
import { createLogger } from './pinologger.ts';
const log = createLogger('[FFPROBE]')

export const getFFProbeData = async (filepath: string) => {
  try {
    const data = await ffprobe(filepath, { path: ffprobeStatic.path })
    return { ...data, creationTime: getCreationTimeFromFFProbeData(data) }
  } catch (error) {
    log.error(`GET_FFPROBE_ERROR: ${error}`)
    return null
  }
}

const getCreationTimeFromFFProbeData = (result: FFProbeResult | null) => {
  const date = result?.streams?.[0]?.tags?.creation_time
  return date
    ? new Date(date)
    : null
}