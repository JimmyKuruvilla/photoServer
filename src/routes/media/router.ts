import express, { NextFunction, Request, Response } from 'express';
import { getFavoritesFromDb, getMarkedFromDb } from '../../db.ts';
import { getDb } from '../../db/initDb.ts';
import { dirTemplate } from '../../pages/dirTemplate.ts';
import { constructMediaListingsFromDb } from '../../services/listings.ts';
import { tagsRouter } from './tags/router.ts';
export const mediaRouter = express.Router();
const db = await getDb();

mediaRouter.get('/media/favorites', async (req: Request, res: Response, next: NextFunction) => {
  const dbItems = await getFavoritesFromDb(db);
  const listings = constructMediaListingsFromDb(dbItems);
  res.send(dirTemplate(listings as any));
});


mediaRouter.get('/media/marked', async (req: Request, res: Response, next: NextFunction) => {
  const dbItems = await getMarkedFromDb(db);
  const listings = constructMediaListingsFromDb(dbItems);
  res.send(dirTemplate(listings as any));
});

mediaRouter.use('/media', tagsRouter)

