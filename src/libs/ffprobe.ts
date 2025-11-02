import ffprobe from 'ffprobe';
import ffprobeStatic from 'ffprobe-static';
import { log } from './log.ts';

export const getFFProbeData = (filepath: string) => {
  try {
    return ffprobe(filepath, { path: ffprobeStatic.path })
  } catch (error) {
    log(`GET_FFPROBE_ERROR: ${error}`)
    return null
  }
}