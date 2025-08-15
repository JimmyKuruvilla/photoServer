import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { getItemViaPath } from '../../db.ts';
import { constructFileViewFromDb } from '../../services/listings.ts';
import { imgVidTemplate } from '../../pages/imgVidTemplate.ts';
import { getBeforeAndAfterItems } from '../../services/media.ts';
export const fileRouter = express.Router();

/**
 * File view at path
 */
fileRouter.get('/fileView/:path(*)', async (req: Request, res: Response, next: NextFunction) => {
  const targetPath = path.join(path.sep, req.params.path);
  try {
    const dbItem = await getItemViaPath(db, targetPath);
    if (!dbItem) {
      return res.status(404).send({ error: 'Item not found' });
    }
    const [item, [beforeItem, afterItem]] = await Promise.all([constructFileViewFromDb(dbItem), getBeforeAndAfterItems(dbItem.path)])

    res.send(imgVidTemplate(item, '', null, beforeItem, afterItem));
    return;
  }
  catch (e: any) {
    res.status(404).send({ error: e.message });
    return;
  }
});

/**
 * File at path
 */
fileRouter.get('/file/:path(*)', async (req: Request, res: Response, next: NextFunction) => {
  const targetPath = path.join(path.sep, req.params.path);
  try {
    res.sendFile(targetPath);
  } catch (error: any) {
    next(error)
  }
});