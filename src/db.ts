
import { Knex } from 'knex';
import { COLS, TableName, TABLES, TAGS } from './constants.js';
import { isImage, isVideo } from './guards.js';
import { createLogger } from './libs/log.ts';
import { encacheListings, PrefetchedRandoms } from './services/media.ts';
import { isIgnorePath } from './utils.ts';
import { StructuredImageDescriptionResponseJson } from './libs/models/prompts.ts';
const log = createLogger('DB')
export type MediaType = 'image' | 'video' | null

export interface DbMedia {
  id: number;
  path: string;
  created_at: Date,
  updated_at: Date,
  hash: string;
  media_type: MediaType,
  
  // these fields don't exist on videos
  face_count?: number | null;
  metadata?: StructuredImageDescriptionResponseJson | null
  thumbnail?: string;
  orientation?: number;
  model?: string;
}

export interface DbTag {
  id: number;
  value: string;
  media_id: number;
  created_at: Date,
}

export interface DbMediaWithTags extends DbMedia {
  tags: DbTag[]
}

let lastId: number;
let firstId: number;

export const setIdRange = async (db: Knex): Promise<void> => {
  const lastIdResult = await getLastId(db);
  const firstIdResult = await getFirstId(db);

  lastId = lastIdResult.id;
  firstId = firstIdResult.id;

  log(`first ${firstId}, last ${lastId}`);
};

export function getRandomInt(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
}

// dumb but fast
export async function getRandomFromDbV1(db: Knex, type: 'image' | 'video' = 'image'): Promise<DbMediaWithTags> {
  const filterFn = type === 'image' ? isImage : isVideo;
  let isMatch = false;
  let dbItem: DbMediaWithTags | undefined;

  while (!isMatch) {
    const result = await getItemById(db, getRandomInt(firstId, lastId));
    dbItem = result;

    if (dbItem) {
      if (!isIgnorePath(dbItem.path) && filterFn(dbItem.path)) {
        isMatch = true;
      }
    }
  }

  return dbItem!;
}

export async function getRandomListFromDb(db: Knex, type: 'image' | 'video' = 'image', limit: number = 1): Promise<DbMediaWithTags[]> {
  const result = await MediaWithTagsQuery(db)
    .where('media.media_type', type)
    .groupBy('media.id')
    .orderByRaw('RANDOM()')
    .limit(limit)

  return result as DbMediaWithTags[];
}

// TODO check the cache length on each request and prefetch more in the background when it gets low
export async function getRandomFromDbWithCaching(db: Knex, type: 'image' | 'video' = 'image', limit: number = 1): Promise<DbMediaWithTags> {
  let list: DbMediaWithTags[]
  if (PrefetchedRandoms[type].length === 0) {
    log(`Prefetching randoms:${type}: ${limit}`)
    list = await getRandomListFromDb(db, type, limit)
    PrefetchedRandoms[type].push(...list)
    await encacheListings(PrefetchedRandoms[type].map(dbMedia => dbMedia.path))
  }
  log(`PrefetchedRandoms:${type} length ${PrefetchedRandoms[type].length}`)
  return PrefetchedRandoms[type].pop() as DbMediaWithTags;
}

export async function getById(db: Knex, tableName: TableName, id: number): Promise<DbMedia[]> {
  const result = await db(tableName).select('*').where({ id: parseInt(id.toString(), 10) });
  return result;
}

export async function getFirstId(db: Knex): Promise<{ id: number }> {
  const result = await db<DbMedia, DbMedia>(TABLES.MEDIA).select('id').from(TABLES.MEDIA).orderBy('id', 'asc').limit(1)
  return result[0];
}

export async function getLastId(db: Knex): Promise<{ id: number }> {
  const result = await db<DbMedia, DbMedia>(TABLES.MEDIA).select('id').from(TABLES.MEDIA).orderBy('id', 'desc').limit(1)
  return result[0];
}

export const MediaWithTagsQuery = (db: Knex) => db<DbMedia, DbMediaWithTags>(TABLES.MEDIA)
  .select([
    'media.id',
    'path',
    'thumbnail',
    'face_count',
    'media.created_at',
    'updated_at',
    'media_type',
    'hash',
    'orientation',
    'model',
    db.raw<DbTag>(`json_agg(json_build_object('id', media_tags.id, 'value', media_tags.value)) as tags`)
  ])
  .from(TABLES.MEDIA)
  .leftJoin(TABLES.MEDIA_TAGS, 'media.id', 'media_tags.media_id')

export async function getItemById(db: Knex, id: number): Promise<DbMediaWithTags | undefined> {
  const result = await MediaWithTagsQuery(db)
    .where('media.id', id)
    .groupBy('media.id')

  return result[0];
}

export async function getItemByPath(db: Knex, fullFilePath: string): Promise<DbMediaWithTags | undefined> {
  const path = fullFilePath.replace(/'/g, "''");

  const result = await MediaWithTagsQuery(db)
    .where('media.path', path)
    .groupBy('media.id')

  return result[0];
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

// TODO: add index for media_tags.value
export async function searchOnTags(db: Knex, searchParam: string): Promise<Array<DbMedia & DbTag>> {
  try {
    const dbRes = await db(TABLES.MEDIA_TAGS)
      .where(COLS.MEDIA_TAGS.VALUE, searchParam)
      .innerJoin(TABLES.MEDIA, 'media.id', `${TABLES.MEDIA_TAGS}.media_id`)
      .distinctOn('media.id');

    return dbRes;
  } catch (e) {
    throw e;
  }
}

export async function getFavoritesFromDb(db: Knex) {
  return searchOnTags(db, TAGS.FAVORITE)
}

export async function getMarkedFromDb(db: Knex) {
  return searchOnTags(db, TAGS.MARKED)
}