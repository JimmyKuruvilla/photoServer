#!/usr/bin/env node

const fs = require('fs');
const { promisify } = require('util');
const statAsync = promisify(fs.stat);
const express = require('express');
const path = require('path');
const morgan = require('morgan')
const app = express();
let webRoot = process.argv[2] || __dirname;

const { port, defaultInterval, TABLES } = require('./src/constants');
const { dirTemplate, imgVidTemplate } = require('./src/templates.js');
const { getMediaHtmlFragment } = require('./src/templates.js');
const {
  getListings,
  constructItemFromDb,
  constructMediaListingsFromDb
} = require('./src/listings');
const {
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
} = require('./src/db');
const { dockerDb, localDb } = require('./db/initDb.js');

const fakeInterval = defaultInterval;
const db = localDb();
const ONE_DAY_SECS = 86400;

(async () => {
  await setIdRange(db);
  setInterval(setIdRange, ONE_DAY_SECS * 1000)
})();

app.use(morgan('dev'))
app.use(express.json());

app.get(/.*[/]{1,1}(.*)\.css$/, (req, res, next) => {
  res.sendFile(path.join(__dirname, `src/styles/${req.params[0]}.css`));
});

app.get(/.*[/]{1,1}(.*)\.js$/, (req, res, next) => {
  res.sendFile(path.join(__dirname, `src/scripts/${req.params[0]}.js`));
});

app.get('/favicon.ico/', (req, res, next) => {
  res.sendFile(path.join(__dirname, 'src/assets/favicon.ico'));
});

//called by UI when requesting new random resource as html
app.get('/random', async (req, res, next) => {
  try {
    const dbItem = await getRandomFromDb(db, req.query.type);
    const item = await constructItemFromDb(dbItem, webRoot);
    const [beforeItem, afterItem] = await getBeforeAndAfterItems(item.fullPath)
    res.send(imgVidTemplate(item, null, null, beforeItem, afterItem));
  } catch (e) {
    next(e);
  }
});

//called by slideshow and fbi when getting json response with new json
app.get('/randomUrl', async (req, res, next) => {
  const dbItem = await getRandomFromDb(db, req.query.type);
  const item = await constructItemFromDb(dbItem, webRoot);
  res.json({ ...item, html: getMediaHtmlFragment(item, fakeInterval) });
});

//called by ui for random all
app.get('/random/slideshow', async (req, res, next) => {
  const dbItem = await getRandomFromDb(db, req.query.type || 'image');
  const item = await constructItemFromDb(dbItem, webRoot);
  const [beforeItem, afterItem] = await getBeforeAndAfterItems(item.fullPath)

  res.send(
    imgVidTemplate(item, req.query.type, req.query.interval || defaultInterval, beforeItem, afterItem)
  );
});

async function getBeforeAndAfterItems(fullPath) {
  const fullAbsDirPath = fullPath.substring(0, fullPath.lastIndexOf('/'))
  const listings = await getListings(webRoot, fullAbsDirPath);
  const itemIndex = listings.media.findIndex(m => m.fullPath === fullPath)
  const beforeItem = listings.media[itemIndex - 1 > -1 ? itemIndex - 1 : 0]
  const afterItem = listings.media[itemIndex + 1 < listings.media.length ? itemIndex + 1 : listings.media.length - 1]

  return [beforeItem, afterItem]
}

app.get('/media', async (req, res, next) => {
  try {
    const dbItem = await getItemViaPath(db, req.query.fullpath);
    const item = await constructItemFromDb(dbItem, webRoot);
    const [beforeItem, afterItem] = await getBeforeAndAfterItems(req.query.fullpath)

    res.send(imgVidTemplate(item, null, null, beforeItem, afterItem));
  }
  catch (e) {
    res.status(404).send({ error: e.message });
  }
});

app.get('/media/favorites', async (req, res, next) => {
  const dbItems = await getFavoritesFromDb(db);
  const listings = constructMediaListingsFromDb(dbItems, webRoot);
  res.send(dirTemplate(listings));
});

app.patch('/media/:id/favorite', async (req, res, next) => {
  if (req.body.favorite !== undefined) {
    try {
      const dbRes = await updateFieldById(db, TABLES.IMAGES, req.params.id, 'favorite', req.body.favorite);
      res.status(200).json(dbRes[0]);
    } catch (e) {
      res.send(e)
    }
  } else {
    res.status(422).send('favorite:boolean not in json');
  }
});

app.get('/media/marked', async (req, res, next) => {
  const dbItems = await getMarkedFromDb(db);
  const listings = constructMediaListingsFromDb(dbItems, webRoot);
  res.send(dirTemplate(listings));
});

app.patch('/media/:id/marked', async (req, res, next) => {
  if (req.body.marked !== undefined) {
    try {
      const dbRes = await updateFieldById(db, TABLES.IMAGES, req.params.id, 'marked', req.body.marked);
      res.status(200).json(dbRes[0]);
    } catch (e) {
      res.send(e)
    }
  } else {
    res.status(422).send('marked:boolean not in json');
  }
});


app.get('/media/tags', async (req, res, next) => {
  const dbItems = await searchOnTags(db, req.query.search);
  const listings = constructMediaListingsFromDb(dbItems, webRoot);
  const noResults = `<html><body><div class="no-search-results"> no results for ${req.query.search}</div></body></html>`
  res.json({ html: listings.media.length ? dirTemplate(listings) : noResults });
});

app.post('/media/tags', async (req, res, next) => {
  try {

    if (req.body.tagValue) {
      const tags = req.body.tagValue.split(',').map(tag => tag.trim());
      const createdTagIds = [];
      for (const tag of tags) {
        const dbRes = await createTag(db, req.body.mediaId, tag);
        createdTagIds.push(dbRes[0]);
      }
    }

    res.status(201).json({ ids: createdTagIds });
  } catch (e) {
    res.send(e)
  }
});

app.get('/media/tags/:tagId', async (req, res, next) => {
  try {
    const dbRes = await getById(db, TABLES.TAGS, req.params.tagId);
    dbRes.length === 0 ? res.sendStatus(404) : res.status(200).json(dbRes[0]);
  } catch (e) {
    res.send(e)
  }
});

app.patch('/media/tags/:tagId', async (req, res, next) => {
  try {
    const dbRes = await updateFieldById(db, TABLES.TAGS, req.params.tagId, 'value', req.body.tagValue);
    res.status(200).json(dbRes[0]);
  } catch (e) {
    res.send(e)
  }
});

app.delete('/media/tags/:tagId', async (req, res, next) => {
  try {
    const dbRes = await deleteById(db, TABLES.TAGS, req.params.tagId);
    res.status(200).json({});
  } catch (e) {
    res.send(e)
  }
});

app.use('/:name', async (req, res, next) => {
  const dirOrFilePath = path.join(webRoot, decodeURIComponent(req.originalUrl));
  const node = await statAsync(dirOrFilePath);
  if (node.isDirectory()) {
    const listings = await getListings(webRoot, dirOrFilePath);
    res.send(
      dirTemplate(
        Object.assign({}, listings, {
          currentDir: req.params.name
        })
      )
    );
  } else {
    res.sendFile(dirOrFilePath);
  }
});

app.get('/', async (req, res, next) => {
  const listings = await getListings(webRoot, webRoot);
  res.send(
    dirTemplate(
      Object.assign({}, listings, {
        currentDir: ''
      })
    )
  );
});

app.get(async (err, req, res, next) => {
  res.json({ error: err.message })
})

app.listen(port);
