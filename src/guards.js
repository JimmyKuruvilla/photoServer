function isMedia(name) {
  return isPic(name) || isVideo(name);
}

function dbMediaExts(type) {
  const video = `avi|AVI|mp4|MP4`;
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

// SELECT * FROM images
//   knex:query     WHERE path SIMILAR TO '/Users/jkuruvilla/jimmy/photoSite%avi|AVI|mp4|MP4'
//   knex:query     OFFSET floor(
//   knex:query       random() * (SELECT COUNT (*) from images WHERE path SIMILAR TO '/Users/jkuruvilla/jimmy/photoSite%avi|AVI|mp4|MP4'))
//   knex:query       LIMIT 1
