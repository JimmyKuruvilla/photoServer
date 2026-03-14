import { Knex } from 'knex';
import { COLS, TABLES } from '../constants.ts';
import { createLogger } from './pinologger.ts';
const log = createLogger('[DB_GUARDS]');

export const isInDenyList = async (db: Knex, hash: string): Promise<boolean> => {
  if (!hash) {
    throw new Error(`IS_IN_DENY_LIST__NO_HASH: ${hash}`)
  } else {
    return (await db(TABLES.DELETED).where(COLS.DELETED.HASH, hash).limit(1)).length > 0
  }
}

export const isNotInDb = async (db: Knex, path: string | null): Promise<boolean> => {
  if (!path) {
    throw new Error(`IS_NOT_IN_DB__NO_PATH: ${path}`)
  } else {
    return (await db(TABLES.MEDIA).where(COLS.MEDIA.PATH, path)).length === 0;
  }
}