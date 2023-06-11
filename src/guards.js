function isMedia(name) {
  return isPic(name) || isVideo(name);
}

function isPic(name) {
  return /.+\.jpg$|jpeg$|png$/i.test(name);
}

function isVideo(name) {
  return /.+\.mp4$/i.test(name);
}

module.exports = {
  isMedia,
  isPic,
  isVideo
};