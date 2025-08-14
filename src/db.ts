
import { Knex } from 'knex';
import { isPic, isVideo } from  './guards.js';
import { TABLES, TableName } from './constants.js';

interface DbImage {
  id: number;
  path: string;
  favorite: boolean;
  marked: boolean;
  thumbnail?: string;
}

interface DbTag {
  id: number;
  value: string;
  images_id: number;
}

interface ImageWithTags extends DbImage {
  tags: Array<{ id: number; value: string }>;
}

let lastId: number;
let firstId: number;

export const setIdRange = async (db: Knex): Promise<void> => {
  const lastIdResult = await getLastId(db);
  const firstIdResult = await getFirstId(db);
  
  lastId = lastIdResult.id;
  firstId = firstIdResult.id;

  console.log(`first ${firstId}, last ${lastId}`);
};

export function getRandomInt(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
}

// dumb but fast
export async function getRandomFromDb(db: Knex, type: 'image' | 'video' = 'image'): Promise<DbImage> {
  const filterFn = type === 'image' ? isPic : isVideo;
  let isMatch = false;
  let dbItem: DbImage;

  while (!isMatch) {
    const result = await getById(db, TABLES.IMAGES, getRandomInt(firstId, lastId));
    dbItem = result[0];
    if (dbItem && !dbItem.marked && filterFn(dbItem.path)) {
      isMatch = true;
    }
  }

  return dbItem!;
}

export async function getById(db: Knex, tableName: TableName, id: number): Promise<DbImage[]> {
  const result = await db(tableName).select('*').where({ id: parseInt(id.toString(), 10) });
  return result;
}

export async function getFirstId(db: Knex): Promise<{ id: number }> {
  const result = await db.raw(`SELECT id FROM ${TABLES.IMAGES} ORDER BY id ASC LIMIT 1;`);
  return result.rows[0];
}

export async function getLastId(db: Knex): Promise<{ id: number }> {
  const result = await db.raw(`SELECT id FROM ${TABLES.IMAGES} ORDER BY id DESC LIMIT 1;`);
  return result.rows[0];
}

export async function getFavoritesFromDb(db: Knex): Promise<DbImage[]> {
  // currently doesn't support tags
  const result = await db(TABLES.IMAGES).where({ favorite: true });
  return result;
}

export async function getMarkedFromDb(db: Knex): Promise<DbImage[]> {
  // currently doesn't support tags
  const result = await db(TABLES.IMAGES).where({ marked: true });
  return result;
}

export async function getItemViaPath(db: Knex, fullFilePath: string): Promise<ImageWithTags | undefined> {
  const path = fullFilePath.replace(/'/g, "''");

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
    images.path = '${path}'
  GROUP BY
    images.id;
`);

  return result.rows[0];
}

export async function updateFieldById<T = any>(
  db: Knex, 
  tableName: TableName, 
  id: number, 
  field: string, 
  value: T
): Promise<T[]> {
  const updateItem: Record<string, T> = {};
  updateItem[field] = value;

  try {
    const dbRes = await db(tableName)
      .where({ id })
      .update(updateItem)
      .returning([field]);
    return dbRes;
  } catch (e) {
    throw e;
  }
}

export async function deleteById(db: Knex, tableName: TableName, id: number): Promise<number> {
  try {
    const dbRes = await db(tableName)
      .where({ id })
      .delete();
    return dbRes;
  } catch (e) {
    throw e;
  }
}

export async function createTag(db: Knex, mediaId: number, tagValue: string): Promise<{ id: number }[]> {
  try {
    const dbRes = await db(TABLES.TAGS)
      .insert({ value: tagValue, images_id: mediaId }, ['id']);
    return dbRes;
  } catch (e) {
    throw e;
  }
}

export async function searchOnTags(db: Knex, searchParam: string): Promise<DbImage[]> {
  try {
    const dbRes = await db(TABLES.TAGS)
      .whereILike('value', `%${searchParam}%`)
      .innerJoin(TABLES.IMAGES, 'images.id', 'image_tags.images_id')
      .distinctOn('images.id');

    return dbRes;
  } catch (e) {
    throw e;
  }
}
