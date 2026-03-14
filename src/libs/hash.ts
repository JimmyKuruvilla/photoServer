import crypto from 'crypto';
import fs from 'node:fs';
import { createLogger } from './pinologger.ts';
const log = createLogger('[GEN_HASH]');

export const genFileHash = async (filepath: string, algorithm = 'sha256', encoding = 'hex'): Promise<string> => {
  try {
    const hash = await new Promise<string>((resolve, reject) => {
      const hasher = crypto.createHash(algorithm);
      const file = fs.createReadStream(filepath);

      file.on('error', err => {
        reject(err);
      });

      file.pipe(hasher);

      hasher.on('finish', () => {
        resolve(hasher.read().toString(encoding));
      });
    });

    return hash
  } catch (error) {
    throw new Error(`GEN_HASH_ERROR ${error}`)
  }
}