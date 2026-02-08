import express, { NextFunction, Request, Response } from 'express';
import { readFileSync } from 'fs';
import path from 'path';
import { getItemByPath } from '../../db.ts';
import { getDb } from '../../db/initDb.ts';
import { imgVidTemplate } from '../../pages/imgVidTemplate.ts';
import { logTemplate } from '../../pages/logTemplate.ts';
import { constructFileViewFromDb } from '../../services/listings.ts';
import { getBeforeAndAfterItems } from '../../services/media.ts';
import type { StructuredImageDescriptionResponseJson } from '../../libs/models/prompts.ts';
import { SUPPORTED_METADATA } from '../../services/metadata.ts';
const db = await getDb();
export const metadataRouter = express.Router();


metadataRouter.use(express.urlencoded({ extended: true }))// no need right?
/**
 * Returns list of supported metadata that can be searched on
 */
metadataRouter.get('/metadata', async (req: Request, res: Response, next: NextFunction) => {
  const query = req.query;
  console.log(query)
  try {
    if (Object.keys(query).length > 0) {
      res.json({ search: query })
      // const dbItems = await searchOnTags(db, search);
      // const listings = constructMediaListingsFromDb(dbItems);
      // const noResults = `<html><body><div class="no-search-results"> no results for ${search}</div></body></html>`
      // res.json({ html: listings.media.length ? dirTemplate(listings as any) : noResults });
    } else {
      res.json(SUPPORTED_METADATA)
    }
  }
  catch (e: any) {
    res.status(404).send({ error: e.message });
    // next?
    return;
  }
});

