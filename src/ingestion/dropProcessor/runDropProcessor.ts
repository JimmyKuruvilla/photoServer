import chokidar from 'chokidar';
import fs from 'node:fs/promises';
import path from 'path';
import { log } from '../../../scripts/lib/log.ts';
import { moveFileByCreationDate } from '../../../scripts/lib/moveByDate.ts';
import { ingest } from '../ingestion.ts';

(async () => {
  const sourceDir = process.env.SOURCE_PATH;
  const targetDir = process.env.TARGET_PATH;

  if (!sourceDir || !targetDir) {
    throw new Error('Need both source and target dirs');
  }

  const watcher = chokidar.watch(sourceDir, { awaitWriteFinish: { pollInterval: 1000 } });

  watcher
    .on('ready', () => log('WATCHER::READY'))
    .on('error', error => log(`WATCHER::ERROR: ${error}`))
    .on('add', async (absPath) => {
      const filename = path.basename(absPath);
      const ext = path.extname(absPath)
      const somePathsAreHidden = absPath.split(path.sep).some(f => f[0] === '.')

      if (ext.includes('part')) {
        log(`WATCHER::SKIPPING_PARTIAL_UPLOAD (part) ${filename}`);
        return
      }

      if (filename.startsWith('.trashed')) {
        log(`WATCHER::DELETING_TRASHED_FILE (.trashed) ${filename}`);
        await fs.unlink(absPath)
        return
      }

      if (somePathsAreHidden) {
        log(`WATCHER::SKIPPING_HIDDEN_FOLDER_OR_FILE ${absPath}`);
        return
      }

      log(`WATCHER::PROCESSING_NEW_FILE ${absPath}`);
      const newFilePath = await moveFileByCreationDate(targetDir)(absPath);
      if (newFilePath !== null) {
        log(`INGEST::MOVED_FILE_PATH ${newFilePath}`)
        await ingest(newFilePath);
      } else {
        log(`WATCHER::SKIPPING_NON_MEDIA_FILE`)
      }
    })

})();
