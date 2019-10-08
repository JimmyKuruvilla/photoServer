#!/usr/bin/env node

const fs = require('fs');
const { promisify } = require('util');
const statAsync = promisify(fs.stat);
const express = require('express');
const path = require('path');
const app = express();
let webRoot = process.argv[2] || __dirname;

const { dirTemplate, imgVidTemplate } = require('./src/templates.js');
const { getMediaHtmlFragment } = require('./src/templates.js');
const { getListings, constructItemFromDb } = require('./src/listings');
const { getRandomFromDb } = require('./src/random');
const { port, defaultInterval } = require('./src/constants');
const { dockerDb, localDb } = require('./db/initDb.js');
const fakeInterval = defaultInterval;
const isDockerDb = process.env.DOCKERDB;
const db = isDockerDb ? dockerDb() : localDb();

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

app.use('/randomUrl', async (req, res, next) => {
  const dbItem = await getRandomFromDb(db, webRoot);
  const item = await constructItemFromDb(dbItem, webRoot);
  res.json({ ...item, html: getMediaHtmlFragment(item, fakeInterval) });
});

app.use('/:directory/randomUrl', async (req, res, next) => {
  const dirOrFilePath = path.join(
    webRoot,
    decodeURIComponent(req.params.directory)
  );

  const dbItem = await getRandomFromDb(db, dirOrFilePath);
  const item = await constructItemFromDb(dbItem, webRoot);
  res.json({ ...item, html: getMediaHtmlFragment(item, fakeInterval) });
});

app.use('/random/slideshow', async (req, res, next) => {
  const dbItem = await getRandomFromDb(db, webRoot);
  const item = await constructItemFromDb(dbItem, webRoot);
  res.send(imgVidTemplate(item, req.query.interval || defaultInterval));
});

app.use('/:directory/slideshow', async (req, res, next) => {
  const dirOrFilePath = path.join(
    webRoot,
    decodeURIComponent(req.params.directory)
  );

  const dbItem = await getRandomFromDb(db, dirOrFilePath);
  const item = await constructItemFromDb(dbItem, webRoot);
  res.send(
    imgVidTemplate(
      item,
      req.query.interval || defaultInterval,
      req.params.directory
    )
  );
});

app.use('/random', async (req, res, next) => {
  const dbItem = await getRandomFromDb(db, webRoot);
  const item = await constructItemFromDb(dbItem, webRoot);
  res.send(imgVidTemplate(item));
});

app.patch('/photos/:id/favorite', async (req, res, next) => {
  if (req.body.favorite !== undefined) {
    db('images')
      .where({ id: req.params.id })
      .update({ favorite: req.body.favorite })
      .then(() => {
        res.sendStatus(200);
      })
      .catch(e => {
        res.send(e);
      });
  } else {
    res.status(422).send('favorite:boolean not in json');
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

app.use('/', async (req, res, next) => {
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
