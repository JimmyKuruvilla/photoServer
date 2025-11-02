import crypto from 'crypto';
import fs from 'node:fs';

export const genFileHash = async (filepath: string, algorithm = 'sha256', encoding = 'hex'): Promise<string> => {
  return new Promise((resolve, reject) => {
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
}