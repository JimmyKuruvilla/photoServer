const path = require('path');
const { dirsStr, mediaStr, redirectItem } = require('./constants');
const { isRedirectToRandom } = require('./guards');
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
  return arr.length > 0 ? arr[randomNum(0, arr.length - 1)] : redirectItem;
}

function getRandom(webRoot, fullPath, shouldStop = false, dirsOrMedia) {
  const listings = getListings(webRoot, fullPath);
  const entry = dirsOrMedia || getDirsOrMedia();
  if (listings[entry].length > 0) {
    const item = getRandomOrRedirect(listings[entry]);
    if (isRedirectToRandom(item)) {
      return redirectItem;
    }

    if (entry === dirsStr) {
      if (shouldStop) {
        return getRandomOrRedirect(listings[mediaStr]);
      } else {
        return getRandom(
          webRoot,
          path.join(webRoot, item.webPath),
          shouldStopNow()
        );
      }
    } else {
      return getRandomOrRedirect(listings[mediaStr]);
    }
  } else {
    const altEntry = entry === dirsStr ? mediaStr : dirsStr;
    if (listings[altEntry].length === 0) {
      return redirectItem;
    } else {
      return getRandom(webRoot, fullPath, shouldStop, altEntry);
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
