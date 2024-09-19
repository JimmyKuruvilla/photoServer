const path = require('path');
const chokidar = require('chokidar');
const { moveFileByCreationDate } = require('./moveByDate');
const { createOrUpdateFromFilePath } = require('./updateDb');
const { log } = require('./log');

(async () => {
  const sourceDir = process.argv[2];
  const targetDir = process.argv[3];

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
