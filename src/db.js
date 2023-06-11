const path = require('path');
const { isPic, isVideo } = require('./guards');

let lastId;
let firstId;

const setIdRange = async (db) => {
  lastId = (await getLastId(db)).id
  firstId = (await getFirstId(db)).id;

  console.log(`first ${firstId}, last ${lastId}`)
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
}

// dumb but fast
async function getRandomFromDb(db, type = 'image') {
  const filterFn = type === 'image' ? isPic : isVideo;
  let isMatch = false;
  let dbItem;

  while (!isMatch) {
    dbItem = await getById(db, getRandomInt(firstId, lastId));
    if (!dbItem.marked && filterFn(dbItem.path)) {
      isMatch = true;
    }
  }
  
  return dbItem;
}

async function getById(db, id) {
  const result = await db.raw(`SELECT * FROM images where id=${id}`);
  return result.rows[0];
}

async function getFirstId(db) {
  const result = await db.raw(`SELECT id FROM images ORDER BY id ASC LIMIT 1;`);
  return result.rows[0];
}

async function getLastId(db) {
  const result = await db.raw(`SELECT id FROM images ORDER BY id DESC LIMIT 1;`);

  return result.rows[0];
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
  setIdRange,
  getRandomFromDb,
  getFavoritesFromDb,
  getMarkedFromDb,
  getItemViaPath,
  updateFieldById,
  getFirstId,
  getLastId,
  getById
};
