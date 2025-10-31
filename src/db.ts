
import { Knex } from 'knex';
import { TABLES, TableName } from './constants.js';
import { isPic, isVideo } from './guards.js';

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
  media_id: number;
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
    const result = await getById(db, TABLES.MEDIA, getRandomInt(firstId, lastId));
    dbItem = result[0];

    if (dbItem) {
      const allowed = dbItem.path.indexOf('__dropoff') === -1
      if (allowed && !dbItem.marked && filterFn(dbItem.path)) {
        isMatch = true;
      }
    }
  }

  return dbItem!;
}

export async function getById(db: Knex, tableName: TableName, id: number): Promise<DbImage[]> {
  const result = await db(tableName).select('*').where({ id: parseInt(id.toString(), 10) });
  return result;
}

export async function getFirstId(db: Knex): Promise<{ id: number }> {
  const result = await db.raw(`SELECT id FROM ${TABLES.MEDIA} ORDER BY id ASC LIMIT 1;`);
  return result.rows[0];
}

export async function getLastId(db: Knex): Promise<{ id: number }> {
  const result = await db.raw(`SELECT id FROM ${TABLES.MEDIA} ORDER BY id DESC LIMIT 1;`);
  return result.rows[0];
}

export async function getFavoritesFromDb(db: Knex): Promise<DbImage[]> {
  // currently doesn't support tags
  const result = await db(TABLES.MEDIA).where({ favorite: true });
  return result;
}

export async function getMarkedFromDb(db: Knex): Promise<DbImage[]> {
  // currently doesn't support tags
  const result = await db(TABLES.MEDIA).where({ marked: true });
  return result;
}

export async function getItemViaPath(db: Knex, fullFilePath: string): Promise<ImageWithTags | undefined> {
  const path = fullFilePath.replace(/'/g, "''");

  const result = await db.raw(`SELECT
    media.id,
    path,
    favorite,
    marked,
    thumbnail,
    json_agg(json_build_object('id', mt.id, 'value', mt.value)) as tags
  FROM
    ${TABLES.MEDIA}
    left join ${TABLES.MEDIA_TAGS} as mt on mt.media_id = media.id
  WHERE 
    media.path = '${path}'
  GROUP BY
    media.id;
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
    const dbRes = await db(TABLES.MEDIA_TAGS)
      .insert({ value: tagValue, media_id: mediaId }, ['id']);
    return dbRes;
  } catch (e) {
    throw e;
  }
}

export async function searchOnTags(db: Knex, searchParam: string): Promise<DbImage[]> {
  try {
    const dbRes = await db(TABLES.MEDIA_TAGS)
      .whereILike('value', `%${searchParam}%`)
      .innerJoin(TABLES.MEDIA, 'media.id', `${TABLES.MEDIA_TAGS}.media_id`)
      .distinctOn('media.id');

    return dbRes;
  } catch (e) {
    throw e;
  }
}
