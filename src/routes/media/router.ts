import express, { Request, Response, NextFunction } from 'express';
import { TABLES } from '../../constants.ts';
import { getFavoritesFromDb, updateFieldById } from '../../db.ts';
import { constructMediaListingsFromDb } from '../../listings.ts';
import { localDb } from '../../db/initDb.ts';
import { tagsRouter } from './tags/router.ts';
import { dirTemplate } from '../../pages/dirTemplate.ts';
export const mediaRouter = express.Router();
const db = await localDb();

mediaRouter.get('/media/favorites', async (req: Request, res: Response, next: NextFunction) => {
  const dbItems = await getFavoritesFromDb(db);
  const listings = constructMediaListingsFromDb(dbItems);
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
  const listings = constructMediaListingsFromDb(dbItems);
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

