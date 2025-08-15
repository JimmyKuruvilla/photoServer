import express, { Request, Response, NextFunction } from 'express';
import { defaultInterval, SERVED_PATH } from '../../constants.ts';
import { localDb } from '../../db/initDb.ts';
import { getRandomFromDb } from '../../db.ts';
import { constructFileViewFromDb } from '../../listings.ts';
import { getBeforeAndAfterItems } from '../../services/media.ts';
import { getMediaHtmlFragment } from '../../pages/getMediaHtmlFragment.ts';
import { imgVidTemplate } from '../../pages/imgVidTemplate.ts';
export const randomRouter = express.Router();
const db = await localDb();
type RandomType = 'image' | 'video'

//called by UI when requesting new random resource as html
randomRouter.get('/random', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const type = req.query.type as string;
    const dbItem = await getRandomFromDb(db, type as 'image' | 'video' | undefined);
    const item = await constructFileViewFromDb(dbItem, SERVED_PATH);
    const [beforeItem, afterItem] = await getBeforeAndAfterItems(item.fullPath)
    res.send(imgVidTemplate(item as any, '', null, beforeItem, afterItem));
  } catch (e) {
    next(e);
  }
});

//called by slideshow and fbi when getting json response with new json
randomRouter.get('/random/cli', async (req: Request, res: Response, next: NextFunction) => {
  const type = req.query.type as RandomType
  const dbItem = await getRandomFromDb(db, type);
  const item = await constructFileViewFromDb(dbItem, SERVED_PATH);
  res.json({ ...item, html: getMediaHtmlFragment(item, defaultInterval, null, null) });
});

//called by ui for random all
randomRouter.get('/random/slideshow', async (req: Request, res: Response, next: NextFunction) => {
  const type = req.query.type as RandomType
  const dbItem = await getRandomFromDb(db, type);
  const item = await constructFileViewFromDb(dbItem, SERVED_PATH);
  const [beforeItem, afterItem] = await getBeforeAndAfterItems(item.fullPath)

  res.send(
    imgVidTemplate(item, type, (req.query.interval ? parseInt(req.query.interval as string) : defaultInterval), beforeItem, afterItem)
  );
});