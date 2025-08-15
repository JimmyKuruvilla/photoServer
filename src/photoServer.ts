#!/usr/bin/env node
const __dirname = import.meta.dirname;
import fs from 'fs';
import { promisify } from 'util';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import morgan from 'morgan';
import { port, TABLES, WEB_ROOT_PATH } from './constants.ts';
import { dirTemplate } from './pages/dirTemplate.ts';
import {
  getListings,
  constructItemFromDb,
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

app.use('/dir/:path', async (req: Request, res: Response, next: NextFunction) => {
  const targetPath = path.join(WEB_ROOT_PATH, req.params.path);
  try {
    const listings = await getListings(WEB_ROOT_PATH, targetPath);
    res.send(dirTemplate(listings));
  } catch (error: any) {
    next(error)
  }
});
app.use('/file/:path', async (req: Request, res: Response, next: NextFunction) => {
  const targetPath = path.join(WEB_ROOT_PATH, req.params.path);
  try {
    res.sendFile(targetPath);
  } catch (error: any) {
    next(error)
  }
});

// app.use('/:name', async (req: Request, res: Response, next: NextFunction) => {
//   const dirOrFilePath = path.join(WEB_ROOT_PATH, decodeURIComponent(req.originalUrl));
//   console.log(dirOrFilePath)
//   try {
//     const node = await statAsync(dirOrFilePath);
//     if (node.isDirectory()) {
//       const listings = await getListings(WEB_ROOT_PATH, dirOrFilePath);
//       res.send(dirTemplate(listings));
//     } else {
//       res.sendFile(dirOrFilePath);
//     }
//   } catch (error: any) {
//     next(error)
//   }
// });

/**
 * Directory listing at root
 */
app.get('/', async (req: Request, res: Response, next: NextFunction) => {
  const listings = await getListings(WEB_ROOT_PATH, WEB_ROOT_PATH);
  res.send(dirTemplate(listings));
});

app.use(errorMiddleware);

app.listen(port);
