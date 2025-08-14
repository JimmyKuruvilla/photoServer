#!/usr/bin/env node
const __dirname = import.meta.dirname;
import fs from 'fs';
import { promisify } from 'util';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import morgan from 'morgan';
import multer from 'multer';
import { printPage, printFile } from './pages/print.ts';
import { port, defaultInterval, TABLES } from './constants.ts';
import { dirTemplate, imgVidTemplate, getMediaHtmlFragment } from './templates.ts';
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

const statAsync = promisify(fs.stat);
const upload = multer({ dest: 'share/__print' });
const app = express();
let webRoot = process.argv[2] || __dirname;

const fakeInterval = defaultInterval;
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

app.get(/.*[/]{1,1}(.*)\.css$/, (req: Request, res: Response, next: NextFunction) => {
  res.sendFile(path.join(__dirname, `client/styles/${req.params[0]}.css`));
});

app.get(/.*[/]{1,1}(.*)\.js$/, (req: Request, res: Response, next: NextFunction) => {
  res.sendFile(path.join(__dirname, `client/scripts/${req.params[0]}.js`));
});

app.get('/favicon.ico/', (req: Request, res: Response, next: NextFunction) => {
  res.sendFile(path.join(__dirname, 'client/assets/favicon.ico'));
});

app.get('/print', async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.send(printPage())
  } catch (e) {
    next(e)
  }
})

app.post('/print/upload', upload.single('fileToPrint'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.file) {
      await printFile(req.file.path)
    }
  } catch (e) {
    next(e)
  }
})

//called by UI when requesting new random resource as html
app.get('/random', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const type = req.query.type as string;
    const dbItem = await getRandomFromDb(db, type as 'image' | 'video' | undefined);
    const item = await constructItemFromDb(dbItem, webRoot);
    const [beforeItem, afterItem] = await getBeforeAndAfterItems(item.fullPath)
    res.send(imgVidTemplate(item as any, '', null, beforeItem, afterItem));
  } catch (e) {
    next(e);
  }
});

//called by slideshow and fbi when getting json response with new json
app.get('/randomUrl', async (req: Request, res: Response, next: NextFunction) => {
  const type = req.query.type as string;
  const dbItem = await getRandomFromDb(db, type as 'image' | 'video' | undefined);
  const item = await constructItemFromDb(dbItem, webRoot);
  res.json({ ...item, html: getMediaHtmlFragment(item as any, fakeInterval, null, null) });
});

//called by ui for random all
app.get('/random/slideshow', async (req: Request, res: Response, next: NextFunction) => {
  const type = req.query.type as string || 'image';
  const dbItem = await getRandomFromDb(db, type as 'image' | 'video');
  const item = await constructItemFromDb(dbItem, webRoot);
  const [beforeItem, afterItem] = await getBeforeAndAfterItems(item.fullPath)

      res.send(
      imgVidTemplate(item as any, type, (req.query.interval as string ? parseInt(req.query.interval as string) : defaultInterval), beforeItem, afterItem)
    );
});

async function getBeforeAndAfterItems(fullPath: string): Promise<[any, any]> {
  const fullAbsDirPath = fullPath.substring(0, fullPath.lastIndexOf('/'))
  const listings = await getListings(webRoot, fullAbsDirPath);
  const itemIndex = listings.media.findIndex(m => m.fullPath === fullPath)
  const beforeItem = listings.media[itemIndex - 1 > -1 ? itemIndex - 1 : 0]
  const afterItem = listings.media[itemIndex + 1 < listings.media.length ? itemIndex + 1 : listings.media.length - 1]

  return [beforeItem, afterItem]
}

app.get('/media', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const fullpath = req.query.fullpath as string;
    const dbItem = await getItemViaPath(db, fullpath);
    if (!dbItem) {
      return res.status(404).send({ error: 'Item not found' });
    }
    const item = await constructItemFromDb(dbItem, webRoot);
    const [beforeItem, afterItem] = await getBeforeAndAfterItems(fullpath)

    res.send(imgVidTemplate(item as any, '', null, beforeItem, afterItem));
    return;
  }
  catch (e: any) {
    res.status(404).send({ error: e.message });
    return;
  }
});

app.get('/media/favorites', async (req: Request, res: Response, next: NextFunction) => {
  const dbItems = await getFavoritesFromDb(db);
  const listings = constructMediaListingsFromDb(dbItems, webRoot);
  res.send(dirTemplate(listings as any));
});

app.patch('/media/:id/favorite', async (req: Request, res: Response, next: NextFunction) => {
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

app.get('/media/marked', async (req: Request, res: Response, next: NextFunction) => {
  const dbItems = await getFavoritesFromDb(db);
  const listings = constructMediaListingsFromDb(dbItems, webRoot);
  res.send(dirTemplate(listings as any));
});

app.patch('/media/:id/marked', async (req: Request, res: Response, next: NextFunction) => {
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


app.get('/media/tags', async (req: Request, res: Response, next: NextFunction) => {
  const search = req.query.search as string;
  const dbItems = await searchOnTags(db, search);
  const listings = constructMediaListingsFromDb(dbItems, webRoot);
  const noResults = `<html><body><div class="no-search-results"> no results for ${search}</div></body></html>`
  res.json({ html: listings.media.length ? dirTemplate(listings as any) : noResults });
});

app.post('/media/tags', async (req: Request, res: Response, next: NextFunction) => {
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

app.get('/media/tags/:tagId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dbRes = await getById(db, TABLES.TAGS, parseInt(req.params.tagId));
    dbRes.length === 0 ? res.sendStatus(404) : res.status(200).json(dbRes[0]);
  } catch (e: any) {
    res.send(e)
  }
});

app.patch('/media/tags/:tagId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dbRes = await updateFieldById(db, TABLES.TAGS, parseInt(req.params.tagId), 'value', req.body.tagValue);
    res.status(200).json(dbRes[0]);
  } catch (e: any) {
    res.send(e)
  }
});

app.delete('/media/tags/:tagId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dbRes = await deleteById(db, TABLES.TAGS, parseInt(req.params.tagId));
    res.status(200).json({});
  } catch (e: any) {
    res.send(e)
  }
});

app.use('/:name', async (req: Request, res: Response, next: NextFunction) => {
  const dirOrFilePath = path.join(webRoot, decodeURIComponent(req.originalUrl));
  const node = await statAsync(dirOrFilePath);
  if (node.isDirectory()) {
    const listings = await getListings(webRoot, dirOrFilePath);
    res.send(
      dirTemplate(
        Object.assign({}, listings, {
          currentDir: req.params.name
        }) as any
      )
    );
  } else {
    res.sendFile(dirOrFilePath);
  }
});

app.get('/', async (req: Request, res: Response, next: NextFunction) => {
  const listings = await getListings(webRoot, webRoot);
  res.send(
    dirTemplate(
      Object.assign({}, listings, {
        currentDir: ''
      }) as any
    )
  );
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  res.json({ error: err.message })
});

app.listen(port);
