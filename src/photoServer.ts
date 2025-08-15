#!/usr/bin/env node
const __dirname = import.meta.dirname;
import fs from 'fs';
import { promisify } from 'util';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import morgan from 'morgan';
import { port, TABLES, SERVED_PATH } from './constants.ts';
import { dirTemplate } from './pages/dirTemplate.ts';
import {
  getListings,
  constructFileViewFromDb,
  constructMediaListingsFromDb
} from './listings.ts';
import {
  setIdRange,
  getRandomFromDb,
  getFavoritesFromDb,
  getMarkedFromDb,
  getItemViaPath,
  updateFieldById,
  deleteById,
  createTag,
  getById,
  searchOnTags
} from './db.ts';
import { dockerDb, localDb } from './db/initDb.ts';
import { printRouter } from './routes/print/router.ts';
import { clientRouter } from './routes/client/router.ts';
import { getBeforeAndAfterItems } from './services/media.ts';
import { randomRouter } from './routes/random/router.ts';
import { errorMiddleware } from './middleware/error.ts';
import { mediaRouter } from './routes/media/router.ts';
import { imgVidTemplate } from './pages/imgVidTemplate.ts';

const statAsync = promisify(fs.stat);
const app = express();


const db = await localDb();
const ONE_DAY_SECS = 86400;

(async () => {
  try {
    await setIdRange(db);
    setInterval(setIdRange, ONE_DAY_SECS * 1000)
  } catch (error) {
    console.error('Error in setIdRange:', error);
  }
})();

app.use(morgan('dev'))
app.use(express.json());


app.use(clientRouter)
app.use(printRouter)
app.use(randomRouter)
app.use(mediaRouter)

app.get('/dirView/:path(*)', async (req: Request, res: Response, next: NextFunction) => {
  const targetPath = path.join(path.sep, req.params.path);
  try {
    const listings = await getListings(SERVED_PATH, targetPath);
    res.send(dirTemplate(listings));
  } catch (error: any) {
    next(error)
  }
});
app.get('/fileView/:path(*)', async (req: Request, res: Response, next: NextFunction) => {
  const targetPath = path.join(path.sep, req.params.path);
  try {
    const dbItem = await getItemViaPath(db, targetPath);
    if (!dbItem) {
      return res.status(404).send({ error: 'Item not found' });
    }
    const item = await constructFileViewFromDb(dbItem, SERVED_PATH);
    const [beforeItem, afterItem] = await getBeforeAndAfterItems(targetPath)

    res.send(imgVidTemplate(item as any, '', null, beforeItem, afterItem));
    return;
  }
  catch (e: any) {
    res.status(404).send({ error: e.message });
    return;
  }
});

app.get('/file/:path(*)', async (req: Request, res: Response, next: NextFunction) => {
  const targetPath = path.join(path.sep, req.params.path);
  try {
    res.sendFile(targetPath);
  } catch (error: any) {
    next(error)
  }
});
// remove interval bullshit
// rename routes to xView

/**
 * Directory listing at root
 */
app.get('/', async (req: Request, res: Response, next: NextFunction) => {
  const listings = await getListings(SERVED_PATH, SERVED_PATH);
  res.send(dirTemplate(listings));
});

app.use(errorMiddleware);

app.listen(port);
