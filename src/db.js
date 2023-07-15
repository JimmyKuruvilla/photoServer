const path = require('path');
const { isPic, isVideo } = require('./guards');
const { TABLES } = require('./constants');

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
    dbItem = (await getById(db, TABLES.IMAGES, getRandomInt(firstId, lastId)))[0];
    if (!dbItem.marked && filterFn(dbItem.path)) {
      isMatch = true;
    }
  }

  return dbItem;
}

async function getById(db, tableName, id) {
  const result = await db(tableName).select('*').where({ id: parseInt(id, 10) });
  return result;
}

async function getFirstId(db) {
  const result = await db.raw(`SELECT id FROM ${TABLES.IMAGES} ORDER BY id ASC LIMIT 1;`);
  return result.rows[0];
}

async function getLastId(db) {
  const result = await db.raw(`SELECT id FROM ${TABLES.IMAGES} ORDER BY id DESC LIMIT 1;`);

  return result.rows[0];
}

async function getFavoritesFromDb(db) {
  // currently doesn't support tags
  const result = await db(TABLES.IMAGES).where({ favorite: true });
  return result;
}

async function getMarkedFromDb(db) {
  // currently doesn't support tags
  const result = await db(TABLES.IMAGES).where({ marked: true });
  return result;
}

async function getItemViaPath(db, fullFilePath) {
  const result = await db.raw(`SELECT
    images.id,
    path,
    favorite,
    marked,
    thumbnail,
    json_agg(json_build_object('id', it.id, 'value', it.value)) as tags
  FROM
    ${TABLES.IMAGES}
    left join ${TABLES.TAGS} as it on it.images_id = images.id
  WHERE 
    images.path = '${fullFilePath}'
  GROUP BY
    images.id;
`);

  return result.rows[0];
}

async function updateFieldById(db, tableName, id, field, value) {
  const updateItem = {};
  updateItem[field] = value;

  try {
    const dbRes = await db(tableName)
      .where({ id })
      .update(updateItem)
      .returning([field]);
    return dbRes;
  } catch (e) {
    throw e
  }
}

async function deleteById(db, tableName, id) {
  try {
    const dbRes = await db(tableName)
      .where({ id })
      .delete();
    return dbRes;
  } catch (e) {
    throw e
  }
}

async function createTag(db, mediaId, tagValue) {
  try {
    const dbRes = await db(TABLES.TAGS)
      .insert({ value: tagValue, images_id: mediaId }, ['id'])
    return dbRes;
  } catch (e) {
    throw e
  }
}

async function searchOnTags(db, searchParam) {
  try {
    const dbRes = await db(TABLES.TAGS)
      .select('*')
      .whereILike('value', `%${searchParam}%`)
      .innerJoin(TABLES.IMAGES, 'images.id', 'image_tags.images_id')

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
  deleteById,
  getFirstId,
  getLastId,
  getById,
  createTag,
  searchOnTags
};
