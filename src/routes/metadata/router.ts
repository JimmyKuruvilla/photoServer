import express, { NextFunction, Request, Response } from 'express';
import { searchOnMetadata } from '../../db.ts';
import { getDb } from '../../db/initDb.ts';
import { constructMediaListingsFromDb } from '../../services/listings.ts';
import { METADATA_BY_NAME, parseQuery, SUPPORTED_METADATA } from '../../services/metadata.ts';
import { ListingsPage } from '../../templates/listings.ts';
import { NotFoundPage } from '../../templates/notFound.ts';
const db = await getDb();
export const metadataRouter = express.Router();
/**
 * Returns list of supported metadata that can be searched on when query is empty
 * Returns the result of the query when query is provided
 */
metadataRouter.get('/metadata', async (req: Request, res: Response, next: NextFunction) => {
  const search = parseQuery(req.query)
  try {
    if (Object.keys(search).length > 0) {
      const dbItems = await searchOnMetadata(db, search.textSearch, search.nonTextSearchFields);
      const listings = constructMediaListingsFromDb(dbItems);
      res.send(listings.media.length ? ListingsPage(listings as any) : NotFoundPage(search));
      // TODO refactor tag search / remove the code that requires html to be inserted into the page, just return a new page
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

