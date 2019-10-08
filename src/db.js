const { dbMediaExts } = require('./guards');

async function getRandomFromDb(db, parentPath) {
  const randomResult = await db.raw(
    `
    SELECT * FROM images 
    WHERE path SIMILAR TO '${parentPath}%${dbMediaExts()}' 
    OFFSET floor(
      random() * (SELECT COUNT (*) from images WHERE path SIMILAR TO '${parentPath}%${dbMediaExts()}')) 
      LIMIT 1
      `
  );
  return randomResult.rows[0];
}

async function getFavoritesFromDb(db) {
  const result = await db('images').where({ favorite: true });
  return result;
}

async function getItemViaPath(db, fullFilePath) {
  const result = await db('images').where({ path: fullFilePath });
  return result[0];
}

module.exports = {
  getRandomFromDb,
  getFavoritesFromDb,
  getItemViaPath
};
