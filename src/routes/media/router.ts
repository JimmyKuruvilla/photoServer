import express, { Request, Response, NextFunction } from 'express';
import { SERVED_PATH, TABLES } from '../../constants.ts';
import { getItemViaPath, getFavoritesFromDb, updateFieldById, searchOnTags, createTag, getById, deleteById } from '../../db.ts';
import { constructFileViewFromDb, constructMediaListingsFromDb } from '../../listings.ts';
import { getBeforeAndAfterItems } from '../../services/media.ts';
import { localDb } from '../../db/initDb.ts';
import { tagsRouter } from './tags/router.ts';
import { dirTemplate } from '../../pages/dirTemplate.ts';
import { imgVidTemplate } from '../../pages/imgVidTemplate.ts';
export const mediaRouter = express.Router();
const db = await localDb();
/*
* http://192.168.2.123:4000/media?fullpath=/mnt/backup/media/Christmas.2008/IMG_2748.jpg
*/
// mediaRouter.get('/media', async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const fullpath = req.query.fullpath as string;
//     const dbItem = await getItemViaPath(db, fullpath);
//     if (!dbItem) {
//       return res.status(404).send({ error: 'Item not found' });
//     }
//     const item = await constructItemFromDb(dbItem, SERVED_PATH);
//     const [beforeItem, afterItem] = await getBeforeAndAfterItems(fullpath)

//     res.send(imgVidTemplate(item as any, '', null, beforeItem, afterItem));
//     return;
//   }
//   catch (e: any) {
//     res.status(404).send({ error: e.message });
//     return;
//   }
// });

mediaRouter.get('/media/favorites', async (req: Request, res: Response, next: NextFunction) => {
  const dbItems = await getFavoritesFromDb(db);
  const listings = constructMediaListingsFromDb(dbItems, SERVED_PATH);
  res.send(dirTemplate(listings as any));
});

mediaRouter.patch('/media/:id/favorite', async (req: Request, res: Response, next: NextFunction) => {
  if (req.body.favorite !== undefined) {
    try {
      const dbRes = await updateFieldById(db, TABLES.IMAGES, parseInt(req.params.id), 'favorite', req.body.favorite);
      res.status(200).json(dbRes[0]);
    } catch (e: any) {
      res.send(e)
    }
  } else {
    res.status(422).send('favorite:boolean not in json');
  }
});

mediaRouter.get('/media/marked', async (req: Request, res: Response, next: NextFunction) => {
  const dbItems = await getFavoritesFromDb(db);
  const listings = constructMediaListingsFromDb(dbItems, SERVED_PATH);
  res.send(dirTemplate(listings as any));
});

mediaRouter.patch('/media/:id/marked', async (req: Request, res: Response, next: NextFunction) => {
  if (req.body.marked !== undefined) {
    try {
      const dbRes = await updateFieldById(db, TABLES.IMAGES, parseInt(req.params.id), 'marked', req.body.marked);
      res.status(200).json(dbRes[0]);
    } catch (e: any) {
      res.send(e)
    }
  } else {
    res.status(422).send('marked:boolean not in json');
  }
});

mediaRouter.use('/media', tagsRouter)

