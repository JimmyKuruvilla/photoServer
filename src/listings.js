const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const statAsync = promisify(fs.stat);
const readdirAsync = promisify(fs.readdir);
const ffprobe = require('ffprobe');
const ffprobeStatic = require('ffprobe-static');

const { isMedia, isVideo } = require('./guards');

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

  const nodes = await readdirAsync(fullAbsDirPath);

  for (let nodeName of nodes) {
    const nodeStats = await statAsync(path.join(fullAbsDirPath, nodeName));
    let container = nodeStats.isDirectory()
      ? dirs
      : isMedia(nodeName)
      ? media
      : files;

    let duration = 0;
    if (!nodeStats.isDirectory() && isVideo(nodeName)) {
      const videoInfo = await getVideoInfo(path.join(fullAbsDirPath, nodeName));
      duration = Number(videoInfo.streams[0].duration * 1000);
    }

    container.push({
      name: nodeName,
      webPath: path.join(`${fullAbsDirPath.replace(webRoot, '')}`, nodeName),
      isDirectory: nodeStats.isDirectory(),
      duration
    });
  }

  return {
    dirs,
    files,
    media
  };
}

module.exports = {
  getListings
};
