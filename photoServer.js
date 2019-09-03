#!/usr/bin/env node

const fs = require('fs');
const express = require('express');
const path = require('path');
const app = express();
let webRoot = process.argv[2] || __dirname;

const { dirTemplate, imgTemplate, videoTemplate } = require('./src/templates.js');
const { getListings } = require('./src/listings');
const { isRedirectToRandom, isVideo} = require('./src/guards');
const { getRandom } = require('./src/random');
const { port } = require('./src/constants');

function generalTemplate(item, url, interval, random){
  return isVideo(item.name) ? videoTemplate(item, url, interval) : imgTemplate(item, url, interval, random);
}

app.get('/favicon.ico/', (req, res, next)=>{
  res.sendFile(path.join(__dirname, 'favicon.ico'));
})

app.use('/random/slideshow', (req, res, next) => {
  const item = getRandom(webRoot, webRoot);
  const interval = req.query.interval || 3000;
  const url = `/random/slideshow?interval=${interval}`;
  if (isRedirectToRandom(item)) {
    res.redirect(url);
  } else {
    res.send(generalTemplate(item, url, interval, true));
  }
});

app.use('/:directory/slideshow', (req, res, next) => {
  const path = req.originalUrl.replace('/', '');
  const dirOrFilePath = `${webRoot}/${decodeURIComponent(
    path.replace(/slideshow.*$/, '')
  )}`;
  
  try {
    if (fs.statSync(dirOrFilePath).isDirectory()) {
      const item = getRandom(webRoot, dirOrFilePath);
      const interval = req.query.interval || 3000;
      const url = `/${req.params.directory}/slideshow?interval=${interval}`;
      if (isRedirectToRandom(item)) {
        res.redirect(url);
      } else {
        res.send(generalTemplate(item, url, interval, true));
      }
    } else {
      res.send('else: not a directory');
    }
  } catch (e) {
    res.send('catch: not a directory');
  }
});

app.use('/random', (req, res, next) => {
  const item = getRandom(webRoot, webRoot);
  if (isRedirectToRandom(item)) {
    res.redirect(`/random`);
  } else {
    res.send(generalTemplate(item, null, null, true));
  }
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