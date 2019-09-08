#!/usr/bin/env node

const fs = require('fs');
const express = require('express');
const path = require('path');
const app = express();
let webRoot = process.argv[2] || __dirname;

const { dirTemplate, imgVidTemplate } = require('./src/templates.js');
const { getListings } = require('./src/listings');
const { getRandom } = require('./src/random');
const { port, defaultInterval } = require('./src/constants');

function _getRandom(fullPath){
  let item = null;
  while (item === null) {
    item = getRandom(webRoot, fullPath);
  }
  return item;
}

app.get('/favicon.ico/', (req, res, next)=>{
  res.sendFile(path.join(__dirname, 'favicon.ico'));
})

app.use('/randomUrl', (req, res, next) => {
  const item = _getRandom(webRoot);
  res.json(item);
});

app.use('/:directory/randomUrl', (req, res, next) => {
  const dirOrFilePath = `${webRoot}/${decodeURIComponent(req.params.directory)}`;
  const item = _getRandom(dirOrFilePath);
  res.json(item);
});

app.use('/random/slideshow', (req, res, next) => {
  const item = _getRandom(webRoot);
  res.send(imgVidTemplate(item, req.query.interval || defaultInterval));
});

app.use('/:directory/slideshow', (req, res, next) => {
  const dirOrFilePath = path.join(webRoot, decodeURIComponent(req.params.directory));
  try {
    if (fs.statSync(dirOrFilePath).isDirectory()) {
      const item = _getRandom(dirOrFilePath);
      res.send(imgVidTemplate(item, req.query.interval || defaultInterval, req.params.directory));
    } else {
      res.send('else: not a directory');
    }
  } catch (e) {
    res.send('catch: not a directory');
  }
});

app.use('/random', (req, res, next) => {
  const item = _getRandom(webRoot);
    res.send(imgVidTemplate(item));
});

app.use('/:name', (req, res, next) => {
  const dirOrFilePath = path.join(webRoot, decodeURIComponent(req.originalUrl));
  if (fs.statSync(dirOrFilePath).isDirectory()) {
    res.send(
      dirTemplate(
        Object.assign({}, getListings(webRoot, dirOrFilePath), {
          currentDir: req.params.name
        })
      )
    );
  } else {
    res.sendFile(dirOrFilePath);
  }
});

app.use('/', (req, res, next) => {
  res.send(
    dirTemplate(
      Object.assign({}, getListings(webRoot, webRoot), {
        currentDir: ''
      })
    )
  );
});

app.listen(port);