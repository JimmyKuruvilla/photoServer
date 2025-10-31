import express, { NextFunction, Request, Response } from 'express';
import { readFileSync } from 'fs';
import path from 'path';
import { getItemByPath } from '../../db.ts';
import { localDb } from '../../db/initDb.ts';
import { imgVidTemplate } from '../../pages/imgVidTemplate.ts';
import { logTemplate } from '../../pages/logTemplate.ts';
import { constructFileViewFromDb } from '../../services/listings.ts';
import { getBeforeAndAfterItems } from '../../services/media.ts';
const db = await localDb();
export const fileRouter = express.Router();

/**
 * LogFile view, matches only routes with a __logs path component
 */
fileRouter.get('/fileView/:path(.*__logs.*)', async (req: Request, res: Response, next: NextFunction) => {
  const targetPath = path.join(path.sep, req.params.path);
  try {
    // res.sendFile(targetPath);
    const fileContents = await readFileSync(targetPath, { encoding: 'utf-8' })
    res.send(logTemplate(fileContents));
  }
  catch (e: any) {
    res.status(404).send({ error: e.message });
    return;
  }
});

/**
 * File view at path
 */
fileRouter.get('/fileView/:path(*)', async (req: Request, res: Response, next: NextFunction) => {
  const targetPath = path.join(path.sep, req.params.path);
  console.log('normal', req.params)
  try {
    const dbItem = await getItemByPath(db, targetPath);
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