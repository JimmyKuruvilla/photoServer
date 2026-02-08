import express, { NextFunction, Request, Response } from 'express';
import { searchOnMetadata } from '../../db.ts';
import { getDb } from '../../db/initDb.ts';
import { constructMediaListingsFromDb } from '../../services/listings.ts';
import { METADATA_BY_NAME, SUPPORTED_METADATA } from '../../services/metadata.ts';
import { ListingsPage } from '../../templates/listings.ts';
import { NotFoundPage } from '../../templates/notFound.ts';
const db = await getDb();
export const metadataRouter = express.Router();
const isEmpty = (str: any) => str === ''
/**
 * Returns list of supported metadata that can be searched on when query is empty
 * Returns the result of the query when query is provided
 */
metadataRouter.get('/metadata', async (req: Request, res: Response, next: NextFunction) => {
  const query = req.query;
  const search = Object.entries(query).reduce<Record<string, any>>((acc, [name, value]) => {
    if (!isEmpty(value)) {
      acc[name] = METADATA_BY_NAME[name].type === 'number' ? Number(value) : value
    }
    return acc
  }, {})
  try {
    if (Object.keys(query).length > 0) {
      const dbItems = await searchOnMetadata(db, search);
      const listings = constructMediaListingsFromDb(dbItems);
      res.send(listings.media.length ? ListingsPage(listings as any) : NotFoundPage(search));
      // TODO refactor tag search to be included in this
      // remove the code that requires html to be inserted into the page, just return a new page
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

