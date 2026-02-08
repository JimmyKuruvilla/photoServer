
import { Knex } from 'knex';

import knex from 'knex';
import { dbConfig } from '../../knexfile.js';
import { createLogger } from '../libs/log.ts';
const log = createLogger('INITDB')
let initializedClient: Knex | null = null;

export const getDb = async (): Promise<Knex> => {
  if (initializedClient) { return initializedClient; }

  const env = process.env.IS_TEST === true.toString()
    ? 'test'
    : process.env.IS_LOCAL === true.toString()
      ? 'local'
      : 'prod'

  const envDbConfig = dbConfig[env];
  const db = knex(envDbConfig);

  await testConnection(db);
  initializedClient = db;
  return db;
};

const testConnection = async (db: Knex) => {
  try {
    await db.raw('SELECT 1')
    log('Database connection successful')
  } catch (error) {
    log(`Failed to create database connection: ${error}`);
    throw error;
  }
}

export const getTableSizes = async (db: Knex) => {
  const { rows } = await db.raw(`
  select
    table_name,
    pg_size_pretty(pg_total_relation_size(quote_ident(table_name))),
    pg_total_relation_size(quote_ident(table_name))
  from information_schema.tables
  where table_schema = 'public'
  order by 3 desc;`
  )
  return rows
}