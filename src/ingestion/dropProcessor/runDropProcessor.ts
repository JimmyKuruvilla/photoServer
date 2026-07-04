import chokidar from 'chokidar';
import { log } from '../../libs/log.ts';
import { ingest } from '../ingestion.ts';

(async () => {
  const sourcePath = process.env.SOURCE_PATH;
  const targetPath = process.env.TARGET_PATH;
  const shouldMove = process.env.SHOULD_MOVE === true.toString();
  const shouldAI = process.env.SHOULD_AI === true.toString();

  if (!sourcePath || !targetPath) {
    throw new Error('Need both source and target dirs');
  }

  /**
   * Copying over the network with finder is a multi step process and stabilityThreshold ensures the process can complete before processing starts. Starting too soon can show up as trying to get exif data from empty files and files getting copied to the wrong paths.
   */
  const watcher = chokidar.watch(sourcePath, { awaitWriteFinish: { stabilityThreshold: 5000, pollInterval: 100 } });

  watcher
    .on('ready', () => log('WATCHER::READY'))
    .on('error', error => log(`WATCHER::ERROR: ${error}`))
    .on('add', async (absSourceFilePath) => {
      log(`WATCHER::PROCESSING_NEW_FILE ${absSourceFilePath}`);
      await ingest(absSourceFilePath, targetPath, { shouldMove, shouldAI });
    })
})();
