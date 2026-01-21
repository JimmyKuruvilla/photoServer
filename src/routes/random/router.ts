import express, { NextFunction, Request, Response } from 'express';
import { defaultInterval } from '../../constants.ts';
import { getRandomFromDbWithCaching } from '../../db.ts';
import { getDb } from '../../db/initDb.ts';
import { getMediaHtmlFragment } from '../../pages/getMediaHtmlFragment.ts';
import { imgVidTemplate } from '../../pages/imgVidTemplate.ts';
import { constructFileViewFromDb } from '../../services/listings.ts';
import { getBeforeAndAfterItems } from '../../services/media.ts';
export const randomRouter = express.Router();
const db = await getDb();
type RandomType = 'image' | 'video'

// returns a view for a single random item
randomRouter.get('/randomView', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const type = req.query.type as string;
    const dbItem = await getRandomFromDbWithCaching(db, type as 'image' | 'video' | undefined, 10);

    // the db part is fstat, but the file part is slow
    const item = await constructFileViewFromDb(dbItem);
    const [beforeItem, afterItem] = await getBeforeAndAfterItems(item.dbPath) // SLOW.
    // extract the dirListingCache to its own file
    // then when background the prefetch of the randoms. so the randoms get prefetched, then their associated directories get cached. 

    res.send(imgVidTemplate(item as any, '', null, beforeItem, afterItem));
  } catch (e) {
    next(e);
  }
});

// returns a view that starts the slideshow
randomRouter.get('/random/slideshow', async (req: Request, res: Response, next: NextFunction) => {
  const type = req.query.type as RandomType
  const dbItem = await getRandomFromDbWithCaching(db, type, 10);
  const item = await constructFileViewFromDb(dbItem);
  const [beforeItem, afterItem] = await getBeforeAndAfterItems(item.dbPath)

  res.send(
    imgVidTemplate(item, type, (req.query.interval ? parseInt(req.query.interval as string) : defaultInterval), beforeItem, afterItem)
  );
});

// returns json for slideshow and fbi
randomRouter.get('/random', async (req: Request, res: Response, next: NextFunction) => {
  const type = req.query.type as RandomType
  const dbItem = await getRandomFromDbWithCaching(db, type, 10);
  const item = await constructFileViewFromDb(dbItem);
  res.json({ ...item, html: getMediaHtmlFragment(item, defaultInterval, null, null) });
});
