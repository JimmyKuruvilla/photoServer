
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
const statAsync = promisify(fs.stat);
const readdirAsync = promisify(fs.readdir);

export async function recursiveTraverseDir(
  fullAbsDirPath: string,
  fileCallbackFn: (nodePath: string) => void | Promise<void> = () => { }
): Promise<number> {
  let count = 0;
  const nodes = await readdirAsync(fullAbsDirPath);
  count += nodes.length;

  for (let nodeName of nodes) {
    const nodePath = path.join(fullAbsDirPath, nodeName);
    const nodeStats = await statAsync(nodePath);

    if (nodeStats.isDirectory()) {
      count += await recursiveTraverseDir(nodePath, fileCallbackFn);
    } else {
      await fileCallbackFn(nodePath);
    }
  }
  return count;
}
