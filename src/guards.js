function isMedia(name) {
  return isPic(name) || isVideo(name);
}

function isPic(name) {
  return /.+\.jpg$|jpeg$|png$/i.test(name);
}

function isVideo(name) {
  return /.+\.mp4$|avi$/i.test(name);
}

function isRedirectToRandom(item) {
  return item.name === 'isRedirectToRandom';
}

module.exports = {
  isMedia,
  isPic,
  isVideo,
  isRedirectToRandom
};