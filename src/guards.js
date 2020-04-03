function isMedia(name) {
  return isPic(name) || isVideo(name);
}

function dbMediaExts(type) {
  const oldVideo = `avi|AVI|mp4|MP4`;
  const video = `mp4|MP4`;
  const images = `jpg|jpeg|JPG|JPEG`;
  const defaults = `(${video}|${images})`;
  if (type) {
    return type === 'video' ? `(${video})` : `(${images})`;
  } else {
    return defaults;
  }
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