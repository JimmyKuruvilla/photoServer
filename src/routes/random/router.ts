import express, { Request, Response, NextFunction } from 'express';
import { defaultInterval } from '../../constants.ts';
import { localDb } from '../../db/initDb.ts';
import { getRandomFromDb } from '../../db.ts';
import { constructFileViewFromDb } from '../../listings.ts';
import { getBeforeAndAfterItems } from '../../services/media.ts';
import { getMediaHtmlFragment } from '../../pages/getMediaHtmlFragment.ts';
import { imgVidTemplate } from '../../pages/imgVidTemplate.ts';
export const randomRouter = express.Router();
const db = await localDb();
type RandomType = 'image' | 'video'

// returns a view for a single random item
randomRouter.get('/randomView', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const type = req.query.type as string;
    const dbItem = await getRandomFromDb(db, type as 'image' | 'video' | undefined);
    const item = await constructFileViewFromDb(dbItem);
    const [beforeItem, afterItem] = await getBeforeAndAfterItems(item.dbPath)
    res.send(imgVidTemplate(item as any, '', null, beforeItem, afterItem));
  } catch (e) {
    next(e);
  }
});

// returns a view that starts the slideshow
randomRouter.get('/random/slideshow', async (req: Request, res: Response, next: NextFunction) => {
  const type = req.query.type as RandomType
  const dbItem = await getRandomFromDb(db, type);
  const item = await constructFileViewFromDb(dbItem);
  const [beforeItem, afterItem] = await getBeforeAndAfterItems(item.dbPath)

  res.send(
    imgVidTemplate(item, type, (req.query.interval ? parseInt(req.query.interval as string) : defaultInterval), beforeItem, afterItem)
  );
});

// returns json for slideshow and fbi
randomRouter.get('/random', async (req: Request, res: Response, next: NextFunction) => {
  const type = req.query.type as RandomType
  const dbItem = await getRandomFromDb(db, type);
  const item = await constructFileViewFromDb(dbItem);
  res.json({ ...item, html: getMediaHtmlFragment(item, defaultInterval, null, null) });
});
