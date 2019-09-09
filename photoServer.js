#!/usr/bin/env node

const fs = require('fs');
const { promisify } = require('util');
const statAsync = promisify(fs.stat);
const express = require('express');
const path = require('path');
const app = express();
let webRoot = process.argv[2] || __dirname;

const { dirTemplate, imgVidTemplate } = require('./src/templates.js');
const { getListings } = require('./src/listings');
const { getRandom } = require('./src/random');
const { port, defaultInterval } = require('./src/constants');

const occurences = {};
async function _getRandom(fullPath) {
  let item = null;
  while (item === null) {
    item = await getRandom(webRoot, fullPath);
  }
  return item;
}

app.use('/occurences', async (req, res, next) => {
  res.json(occurences);
});

app.get('/favicon.ico/', (req, res, next) => {
  res.sendFile(path.join(__dirname, 'favicon.ico'));
});

app.use('/randomUrl', async (req, res, next) => {
  const item = await _getRandom(webRoot);
  res.json(item);
});

app.use('/:directory/randomUrl', async (req, res, next) => {
  const dirOrFilePath = `${webRoot}/${decodeURIComponent(
    req.params.directory
  )}`;
  const item = await _getRandom(dirOrFilePath);
  if (occurences[item.webPath]) {
    occurences[item.webPath] += 1;
  } else {
    occurences[item.webPath] = 1;
  }
  res.json(item);
});

app.use('/random/slideshow', async (req, res, next) => {
  const item = await _getRandom(webRoot);
  res.send(imgVidTemplate(item, req.query.interval || defaultInterval));
});

app.use('/:directory/slideshow', async (req, res, next) => {
  const dirOrFilePath = path.join(
    webRoot,
    decodeURIComponent(req.params.directory)
  );

  try {
    const node = await statAsync(dirOrFilePath);
    if (node.isDirectory()) {
      const item = await _getRandom(dirOrFilePath);
      res.send(
        imgVidTemplate(
          item,
          req.query.interval || defaultInterval,
          req.params.directory
        )
      );
    } else {
      res.send('else: not a directory');
    }
  } catch (e) {
    res.send('catch: not a directory');
  }
});

app.use('/random', async (req, res, next) => {
  const item = await _getRandom(webRoot);
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
