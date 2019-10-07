#!/usr/bin/env node

const fs = require('fs');
const { promisify } = require('util');
const statAsync = promisify(fs.stat);
const express = require('express');
const path = require('path');
const app = express();
let webRoot = process.argv[2] || __dirname;


const { dirTemplate, imgVidTemplate } = require('./src/templates.js');
const { getMediaHtml } = require('./src/templates.js');
const { getListings, constructItemFromPath } = require('./src/listings');
const { getRandomFromDb } = require('./src/random');
const { port, defaultInterval } = require('./src/constants');
const { dockerDb } = require('./db/initDb.js');
const fakeInterval = defaultInterval;
const db = dockerDb();

app.get('/favicon.ico/', (req, res, next) => {
  res.sendFile(path.join(__dirname, 'favicon.ico'));
});

app.use('/randomUrl', async (req, res, next) => {
  const filePath = await getRandomFromDb(db, webRoot);
  const item = await constructItemFromPath(filePath, webRoot)
  res.json({...item,  html: getMediaHtml(item, fakeInterval) });
});

app.use('/:directory/randomUrl', async (req, res, next) => {
  const dirOrFilePath = path.join(
    webRoot,
    decodeURIComponent(req.params.directory)
  );

  const filePath = await getRandomFromDb(db, dirOrFilePath);
  const item = await constructItemFromPath(filePath, webRoot);
  res.json({ ...item, html: getMediaHtml(item, fakeInterval) });
});

app.use('/random/slideshow', async (req, res, next) => {
  const filePath = await getRandomFromDb(db, webRoot);
  const item = await constructItemFromPath(filePath, webRoot);
  res.send(imgVidTemplate(item, req.query.interval || defaultInterval));
});

app.use('/:directory/slideshow', async (req, res, next) => {
  const dirOrFilePath = path.join(
    webRoot,
    decodeURIComponent(req.params.directory)
  );

  const filePath = await getRandomFromDb(db, dirOrFilePath);
  const item = await constructItemFromPath(filePath, webRoot);
  res.send(imgVidTemplate(item, req.query.interval || defaultInterval, req.params.directory));
});

app.use('/random', async (req, res, next) => {
  const filePath = await getRandomFromDb(db, webRoot);
  const item = await constructItemFromPath(filePath, webRoot);
  res.send(imgVidTemplate(item));
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
