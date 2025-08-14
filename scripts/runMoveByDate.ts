import { recursiveTraverseDir } from '../src/listings';
import { moveFileByCreationDate } from './moveByDate';

(async () => {
  const sourceDir = process.argv[2];
  const targetDir = process.argv[3];

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
