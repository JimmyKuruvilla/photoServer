
import { recursiveTraverseDir } from '../../src/libs/file/recursiveTraverseDir.ts';
import { moveFileByCreationDate } from '../lib/moveByDate.ts';
/**
 * Moves all files in SOURCE_PATH to best creation date in TARGET_PATH
 */
(async () => {
  const sourceDir = process.env.SOURCE_PATH;
  const targetDir = process.env.TARGET_PATH;

  if (!sourceDir || !targetDir) {
    throw new Error('Need both source and target dirs');
  }

  const count = await recursiveTraverseDir(
    sourceDir,
    moveFileByCreationDate(targetDir) as any
  );

  console.log(`files seen ${count}`);
  process.exit();
})();
