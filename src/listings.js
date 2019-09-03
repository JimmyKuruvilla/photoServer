const fs = require('fs');
const path = require('path');

const { isMedia } = require('./guards');

function getListings(webRoot, fullAbsPath) {
  const dirs = [];
  const files = [];
  const media = [];
  fs.readdirSync(fullAbsPath).forEach(nodeName => {
    const isDirectory = fs
      .statSync(path.join(fullAbsPath, nodeName))
      .isDirectory();
    let container = isDirectory ? dirs : isMedia(nodeName) ? media : files;
    container.push({
      name: nodeName,
      webPath: path.join(`${fullAbsPath.replace(webRoot, '')}`, nodeName),
      isDirectory
    });
  });

  return {
    dirs,
    files,
    media
  };
}

module.exports = {
  getListings
};
