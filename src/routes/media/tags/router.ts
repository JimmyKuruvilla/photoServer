import express, { Request, Response, NextFunction } from 'express';
import { WEB_ROOT_PATH, TABLES } from '../../../constants.ts';
import { searchOnTags, createTag, getById, updateFieldById, deleteById } from '../../../db.ts';
import { localDb } from '../../../db/initDb.ts';
import { constructMediaListingsFromDb } from '../../../listings.ts';
import { dirTemplate } from '../../../pages/dirTemplate.ts';

export const tagsRouter = express.Router();
const db = await localDb();

tagsRouter.get('/tags', async (req: Request, res: Response, next: NextFunction) => {
  const search = req.query.search as string;
  const dbItems = await searchOnTags(db, search);
  const listings = constructMediaListingsFromDb(dbItems, WEB_ROOT_PATH);
  const noResults = `<html><body><div class="no-search-results"> no results for ${search}</div></body></html>`
  res.json({ html: listings.media.length ? dirTemplate(listings as any) : noResults });
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
    const dbRes = await getById(db, TABLES.TAGS, parseInt(req.params.tagId));
    dbRes.length === 0 ? res.sendStatus(404) : res.status(200).json(dbRes[0]);
  } catch (e: any) {
    res.send(e)
  }
});

tagsRouter.patch('/tags/:tagId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dbRes = await updateFieldById(db, TABLES.TAGS, parseInt(req.params.tagId), 'value', req.body.tagValue);
    res.status(200).json(dbRes[0]);
  } catch (e: any) {
    res.send(e)
  }
});

tagsRouter.delete('/tags/:tagId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dbRes = await deleteById(db, TABLES.TAGS, parseInt(req.params.tagId));
    res.status(200).json({});
  } catch (e: any) {
    res.send(e)
  }
});