const { dbMediaExts } = require('./guards');

function randomNum(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

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

module.exports = {
  randomNum,
  getRandomFromDb
};
