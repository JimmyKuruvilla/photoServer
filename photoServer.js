#!/usr/bin/env node

const fs = require('fs');
const { promisify } = require('util');
const statAsync = promisify(fs.stat);
const express = require('express');
const path = require('path');
const morgan = require('morgan')
const app = express();
let webRoot = process.argv[2] || __dirname;

const { port, defaultInterval } = require('./src/constants');
const { dirTemplate, imgVidTemplate } = require('./src/templates.js');
const { getMediaHtmlFragment } = require('./src/templates.js');
const {
  getListings,
  constructItemFromDb,
  constructMediaListingsFromDb
} = require('./src/listings');
const {
  getAnyRandomFromDb,
  getRandomFromDb,
  getFavoritesFromDb,
  getMarkedFromDb,
  getItemViaPath,
  updateFieldById
} = require('./src/db');
const { dockerDb, localDb } = require('./db/initDb.js');

const fakeInterval = defaultInterval;

const db = localDb();

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

app.get('/randomUrl', async (req, res, next) => {
  const dbItem = await getRandomFromDb(db, webRoot, req.query.type);
  const item = await constructItemFromDb(dbItem, webRoot);
  res.json({ ...item, html: getMediaHtmlFragment(item, fakeInterval) });
});

app.get('/:directory/randomUrl', async (req, res, next) => {
  const dirOrFilePath = path.join(
    webRoot,
    decodeURIComponent(req.params.directory)
  );

  const dbItem = await getRandomFromDb(db, dirOrFilePath, req.query.type);
  const item = await constructItemFromDb(dbItem, webRoot);
  res.json({ ...item, html: getMediaHtmlFragment(item, fakeInterval) });
});

app.get('/random/slideshow', async (req, res, next) => {
  const dbItem = await getAnyRandomFromDb(db);
  const item = await constructItemFromDb(dbItem, webRoot);
  res.send(
    imgVidTemplate(item, req.query.type, req.query.interval || defaultInterval)
  );
});

app.get('/:directory/slideshow', async (req, res, next) => {
  // doesn't work for nested directories like : 
  // http://192.168.2.123:4000/Slideshow/Recent%20Photos/2019-09-01/slideshow
  const dirOrFilePath = path.join(
    webRoot,
    decodeURIComponent(req.params.directory)
  );

  const dbItem = await getRandomFromDb(db, dirOrFilePath, req.query.type);
  const item = await constructItemFromDb(dbItem, webRoot);
  res.send(
    imgVidTemplate(
      item,
      req.query.type,
      req.query.interval || defaultInterval,
      req.params.directory
    )
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

app.get('/random', async (req, res, next) => {
  const dbItem = await getAnyRandomFromDb(db);
  const item = await constructItemFromDb(dbItem, webRoot);
  const [beforeItem, afterItem] = await getBeforeAndAfterItems(item.fullPath)
  
  res.send(imgVidTemplate(item, null, null, null, beforeItem, afterItem));
});

app.get('/media', async (req, res, next) => {
  try {
    const dbItem = await getItemViaPath(db, req.query.fullpath);
    const item = await constructItemFromDb(dbItem, webRoot);
    const [beforeItem, afterItem] = await getBeforeAndAfterItems(req.query.fullpath)

    res.send(imgVidTemplate(item, null, null, null, beforeItem, afterItem));
  }
  catch (e) {
    res.status(404).send('Error: file may not be in db yet');
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
      const dbRes = await updateFieldById(db, req.params.id, 'favorite', req.body['favorite']);
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
      const dbRes = await updateFieldById(db, req.params.id, 'marked', req.body['marked']);
      res.status(200).json(dbRes[0]);
    } catch (e) {
      res.send(e)
    }
  } else {
    res.status(422).send('marked:boolean not in json');
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

app.listen(port);
