const path = require('path');
const { dirsStr, mediaStr } = require('./constants');
const { getListings } = require('./listings');

function randomNum(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function shouldStopNow() {
  return Boolean(randomNum(0, 1));
}

function getDirsOrMedia() {
  return randomNum(0, 1) === 0 ? dirsStr : mediaStr;
}

function getRandomOrRedirect(arr) {
  return arr.length > 0 ? arr[randomNum(0, arr.length - 1)] : null;
}

async function getRandom(webRoot, fullPath, shouldStop = false, dirsOrMedia) {
  const listings = await getListings(webRoot, fullPath);
  const entry = dirsOrMedia || getDirsOrMedia();
  if (listings[entry].length > 0) {
    const item = getRandomOrRedirect(listings[entry]);
    if (item === null) {
      return null;
    }

    if (entry === dirsStr) {
      if (shouldStop) {
        return getRandomOrRedirect(listings[mediaStr]);
      } else {
        const randomItem = await getRandom(
          webRoot,
          path.join(webRoot, item.webPath),
          shouldStopNow()
        );
        return randomItem;
      }
    } else {
      return getRandomOrRedirect(listings[mediaStr]);
    }
  } else {
    const altEntry = entry === dirsStr ? mediaStr : dirsStr;
    if (listings[altEntry].length === 0) {
      return null;
    } else {
      const randomItem = await getRandom(webRoot, fullPath, shouldStop, altEntry);
      return randomItem;
    }
  }
}

module.exports = {
  randomNum,
  shouldStopNow,
  getDirsOrMedia,
  getRandomOrRedirect,
  getRandom
};
