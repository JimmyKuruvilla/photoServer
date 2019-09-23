function isMedia(name) {
  return isPic(name) || isVideo(name);
}

function dbMediaExts() {
  return `(jpg|jpeg|JPG|JPEG|avi|AVI|mp4|MP4)`
}

function isPic(name) {
  return /.+\.jpg$|jpeg$|png$/i.test(name);
}

function isVideo(name) {
  return /.+\.mp4$|avi$/i.test(name);
}

module.exports = {
  isMedia,
  isPic,
  isVideo,
  dbMediaExts
};