import path from 'path';
import fs from 'node:fs/promises';
import child_process from 'child_process'
import util from 'util'
import chokidar from 'chokidar';
import { moveFileByCreationDate } from '../lib/moveByDate.ts';
import { createOrUpdateFromFilePath } from '../lib/updateDb.ts';
import { log } from '../lib/log.ts';

(async () => {
  const exec = util.promisify(child_process.exec)
  const sourceDir = process.env.SOURCE_PATH;
  const targetDir = process.env.TARGET_PATH;

  if (!sourceDir || !targetDir) {
    throw new Error('Need both source and target dirs');
  }

  log(`PYTHON:: ACTIVATE_VIRTUAL_ENV`)
  const { stdout, stderr } = await exec(`. ./python/venv/bin/activate`)
  log(stdout)
  log(stderr)

  const watcher = chokidar.watch(sourceDir, { awaitWriteFinish: { pollInterval: 1000 } });
  const onAdd = moveFileByCreationDate(targetDir);

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
      const newFilePath = await onAdd(absPath);
      if (newFilePath !== null) {
        await createOrUpdateFromFilePath(newFilePath);
      }
    })

})();
