import path from 'path';
import chokidar from 'chokidar';
import { moveFileByCreationDate } from './moveByDate';
import { createOrUpdateFromFilePath } from './updateDb';
import { log } from './log';

(async () => {
  const sourceDir = process.env.SOURCE_PATH;
  const targetDir = process.env.TARGET_PATH;

  if (!sourceDir || !targetDir) {
    throw new Error('Need both source and target dirs');
  }

  const watcher = chokidar.watch(sourceDir, { awaitWriteFinish: { pollInterval: 1000 } });
  const onAdd = moveFileByCreationDate(targetDir);

  watcher
    .on('add', async (absPath) => {
      if (!path.extname(absPath).includes('part')) {
        log(`WATCHER_NEW_FILE_SEEN ${absPath}`);
        const newFilePath = await onAdd(absPath);
        if (newFilePath !== null) {
          await createOrUpdateFromFilePath(newFilePath);
        }
      }
    })
    .on('error', error => log(`WATCHER_ERROR: ${error}`))
    .on('ready', () => log('WATCHER_READY'))

})();
