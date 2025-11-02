import path from 'path';
import { IGNORE_PREFIX } from './constants.ts';

export const isIgnorePath = (filepath: string) => {
  const directoryPath = path.dirname(filepath);
  const lastDirectoryName = path.basename(directoryPath);
  return lastDirectoryName.startsWith(IGNORE_PREFIX)
}