const { dbMediaExts } = require('./guards');

async function getRandomFromDb(db, parentPath, type) {
  const randomResult = await db.raw(
    `
    SELECT * FROM images 
    WHERE path SIMILAR TO '${parentPath}%${dbMediaExts(type)}' AND marked=false
    OFFSET floor(
      random() * (SELECT COUNT (*) from images WHERE path SIMILAR TO '${parentPath}%${dbMediaExts(type)}' AND marked=false)) 
      LIMIT 1
      `
  );

  return randomResult.rows[0];
}

async function getFavoritesFromDb(db) {
  const result = await db('images').where({ favorite: true });
  return result;
}

async function getMarkedFromDb(db) {
  const result = await db('images').where({ marked: true });
  return result;
}

async function getItemViaPath(db, fullFilePath) {
  const result = await db('images').where({ path: fullFilePath });
  return result[0];
}

async function updateFieldById(db, id, field, value) {
  const updateItem = {};
  updateItem[field] = value;

  try {
    const dbRes = await db('images')
      .where({ id })
      .update(updateItem)
      .returning([field]);
    return dbRes;
  } catch (e) {
    throw e
  }
}

module.exports = {
  getRandomFromDb,
  getFavoritesFromDb,
  getMarkedFromDb,
  getItemViaPath,
  updateFieldById
};
