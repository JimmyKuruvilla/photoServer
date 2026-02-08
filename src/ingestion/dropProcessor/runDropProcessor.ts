import chokidar from 'chokidar';
import { log } from '../../libs/log.ts';
import { ingest } from '../ingestion.ts';

(async () => {
  const sourcePath = process.env.SOURCE_PATH;
  const targetPath = process.env.TARGET_PATH;

  if (!sourcePath || !targetPath) {
    throw new Error('Need both source and target dirs');
  }

  const watcher = chokidar.watch(sourcePath, { awaitWriteFinish: { pollInterval: 1000 } });

  watcher
    .on('ready', () => log('WATCHER::READY'))
    .on('error', error => log(`WATCHER::ERROR: ${error}`))
    .on('add', async (absSourceFilePath) => {
      log(`WATCHER::PROCESSING_NEW_FILE ${absSourceFilePath}`);
      await ingest(absSourceFilePath, targetPath, { shouldMove: true, shouldAI: true });
    })
})();
