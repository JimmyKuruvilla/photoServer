import express, { NextFunction, Request, Response } from 'express';
import { TABLES } from '../../../constants.ts';
import { createTag, deleteById, getById, searchOnTags, updateFieldById } from '../../../db.ts';
import { getDb } from '../../../db/initDb.ts';
import { ListingsPage } from '../../../templates/listings.ts';
import { constructMediaListingsFromDb } from '../../../services/listings.ts';
import { NotFoundPage } from '../../../templates/notFound.ts';

export const tagsRouter = express.Router();
const db = await getDb();

tagsRouter.get('/tags', async (req: Request, res: Response, next: NextFunction) => {
  const search = req.query.search as string;
  const dbItems = await searchOnTags(db, search);
  const listings = constructMediaListingsFromDb(dbItems);
  res.send(listings.media.length ? ListingsPage(listings as any) : NotFoundPage(search));
});

tagsRouter.post('/tags', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const createdTagIds: number[] = [];

    if (req.body.tagValue) {
      const tags = req.body.tagValue.split(',').map((tag: string) => tag.trim());
      for (const tag of tags) {
        const dbRes = await createTag(db, req.body.mediaId, tag);
        createdTagIds.push(dbRes[0].id);
      }
    }

    res.status(201).json({ ids: createdTagIds });
  } catch (e: any) {
    res.send(e)
  }
});

tagsRouter.get('/tags/:tagId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dbRes = await getById(db, TABLES.MEDIA_TAGS, parseInt(req.params.tagId));
    dbRes.length === 0 ? res.sendStatus(404) : res.status(200).json(dbRes[0]);
  } catch (e: any) {
    res.send(e)
  }
});

tagsRouter.patch('/tags/:tagId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dbRes = await updateFieldById(db, TABLES.MEDIA_TAGS, parseInt(req.params.tagId), 'value', req.body.tagValue);
    res.status(200).json(dbRes[0]);
  } catch (e: any) {
    res.send(e)
  }
});

tagsRouter.delete('/tags/:tagId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dbRes = await deleteById(db, TABLES.MEDIA_TAGS, parseInt(req.params.tagId));
    res.status(200).json({});
  } catch (e: any) {
    res.send(e)
  }
});