#!/usr/bin/env node

const fs = require('fs');
const express = require('express');
const app = express();
let fileRoot = process.argv[2] || __dirname;

const videoSvg = `<svg class="video" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>`;

const folderSvg = `<svg class="folder" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" d="M0 0h24v24H0V0z"/><path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-2.06 11L15 15.28 12.06 17l.78-3.33-2.59-2.24 3.41-.29L15 8l1.34 3.14 3.41.29-2.59 2.24.78 3.33z"/></svg>`;

function template(locals) {
  return `
  <html>
    <head> 
      <style>
      body{
        font-family: 'Helvetica', 'Arial', sans-serif;
        font-size: 16px;
      }
      a{
        text-decoration: none;
      }
      
      li {
        margin: 5px 5px;
      }
        label {
          cursor: pointer;
          display:block;
        }
        svg {
          vertical-align: middle;
        }
        svg.folder {
          width: 40px;
          height: 40px;
        }
        .pic, svg.video {
          width: 200px;
          border-radius: 5px;
          transition: transform 200ms;
        }
        .pic:hover, svg.video:hover{
          border: 3px solid black; 
          transform: scale(1.5);
        }
        .section{
          margin: 20px 0;
        }
        .media {
          margin: 20 px 0;
        }
        .media.section {
          display:flex;
          flex-flow: row wrap;
          justify-content: space-evenly;
        }
      </style>
    </head>
    
    <body>
      <div class="dir section">
      ${ 
        locals.dirs.map(i => `<div class="dir"><a href="${i.webPath}"><label>${folderSvg}${i.name}</label></div>`).join('')
      }
      </div>

      <div class="file section">
      ${
        locals.files.map(i => `<div class="file"><a href="${i.webPath}"><label>${i.name}</label></div>`).join('')
      }
      </div>

      <div class="media section">
      ${
        locals.media.map(i => `<div class="media"><a href="${i.webPath}"><label>${i.name}</label>${isVideo(i.name) ? videoSvg :`<img src="${i.webPath}" class="pic">`}</div>`).join('')
      }
      </div>
    </body>
  </html>`
}

function getListings(fullDirPath) {
  const dirs = [];
  const files = [];
  const media = [];
  fs.readdirSync(fullDirPath).forEach((nodeName) => {
    const isDirectory = fs.statSync(`${fullDirPath}/${nodeName}`).isDirectory();
    let container = isDirectory ? dirs : isMedia(nodeName) ? media : files;
    container.push({
      name: nodeName,
      webPath: `${fullDirPath.replace(fileRoot, '')}/${nodeName}`,
      isDirectory
    });
  });
  return {
    dirs,
    files,
    media
  }
}


function isMedia(name) {
  return /.+\.jpg|mp4$/i.test(name);
}

function isVideo(name) {
  return /.+\.mp4$/.test(name);
}

app.use('/:name', (req, res, next) => {
  const path = req.originalUrl.replace('/', '');
  const newDirOrFile = `${fileRoot}/${decodeURIComponent(path)}`;
  if (fs.statSync(newDirOrFile).isDirectory()) {
    res.send(template(getListings(newDirOrFile)));
  } else {
    res.sendFile(newDirOrFile);
  }
});

app.use('/', (req, res, next) => {
  res.send(template(getListings(fileRoot)));
});

app.listen(4000);
