const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const statAsync = promisify(fs.stat);
const readdirAsync = promisify(fs.readdir);
const ffprobe = require('ffprobe');
const ffprobeStatic = require('ffprobe-static');

const { isMedia, isVideo, isPic } = require('./guards');
const { getItemViaPath } = require('./db');

const { dockerDb, localDb } = require('../db/initDb');
const isDockerDb = process.env.DOCKERDB;
const db = isDockerDb ? dockerDb() : localDb();

const getInfoFromDbItem = (dbItem, webRoot) => {
  const fullFilePath = dbItem.path;
  const name = fullFilePath.replace(/.*\//, '');
  const webPath = fullFilePath.replace(webRoot, '');
  return [fullFilePath, webPath, name];
};

async function getVideoInfo(absPath) {
  try {
    const info = await ffprobe(absPath, {
      path: ffprobeStatic.path
    });
    return info;
  } catch (err) {
    return 0;
  }
}

async function getListings(webRoot, fullAbsDirPath) {
  const dirs = [];
  const files = [];
  const media = [];
  let thumbnail;

  const nodes = await readdirAsync(fullAbsDirPath);

  for (let nodeName of nodes) {
    const nodeStats = await statAsync(path.join(fullAbsDirPath, nodeName));
    let container = nodeStats.isDirectory()
      ? dirs
      : isMedia(nodeName)
        ? media
        : files;

    let duration = 0;
    if (!nodeStats.isDirectory()) {
      if (isVideo(nodeName)) {
        const videoInfo = await getVideoInfo(path.join(fullAbsDirPath, nodeName));
        duration = Number(videoInfo.streams[0].duration * 1000);
      }
      else if (isPic(nodeName)) {
        const img = await getItemViaPath(db, path.join(fullAbsDirPath, nodeName));
        thumbnail = img.thumbnail;
      }
    }

    container.push({
      name: nodeName,
      webPath: path.join(`${fullAbsDirPath.replace(webRoot, '')}`, nodeName),
      fullPath: path.join(fullAbsDirPath, nodeName),
      thumbnail: thumbnail,
      isDirectory: nodeStats.isDirectory(),
      duration,
      id: null,
      favorite: null
    });
  }

  return {
    dirs,
    files,
    media
  };
}

function constructMediaListingsFromDb(dbItems, webRoot) {
  return {
    dirs: [],
    files: [],
    media: dbItems.map(dbItem => {
      const [fullFilePath, webPath, name] = getInfoFromDbItem(dbItem, webRoot);

      return {
        name: name,
        webPath: webPath,
        fullPath: fullFilePath,
        thumbnail: dbItem.thumbnail,
        id: dbItem.id,
        favorite: dbItem.favorite,
        marked: dbItem.marked,
        isDirectory: false,
        duration: null
      };
    })
  };
}

async function constructItemFromDb(dbItem, webRoot) {
  const [fullFilePath, webPath, name] = getInfoFromDbItem(dbItem, webRoot);
  let duration = 0;
  if (isVideo(fullFilePath)) {
    const videoInfo = await getVideoInfo(fullFilePath);
    duration = Number(videoInfo.streams[0].duration * 1000);
  }
  return {
    name: name,
    webPath,
    fullPath: fullFilePath,
    thumbnail: dbItem.thumbnail,
    isDirectory: false,
    duration,
    id: dbItem.id,
    favorite: dbItem.favorite,
    marked: dbItem.marked
  };
}

async function recursiveTraverseDir(
  fullAbsDirPath,
  fileCallbackFn = nodePath => { }
) {
  let count = 0;
  const nodes = await readdirAsync(fullAbsDirPath);
  count += nodes.length;

  for (let nodeName of nodes) {
    const nodePath = path.join(fullAbsDirPath, nodeName);
    const nodeStats = await statAsync(nodePath);

    if (nodeStats.isDirectory()) {
      count += await recursiveTraverseDir(nodePath, fileCallbackFn);
    } else {
      await fileCallbackFn(nodePath);
    }
  }
  return count;
}

module.exports = {
  getListings,
  recursiveTraverseDir,
  constructItemFromDb,
  constructMediaListingsFromDb
};
