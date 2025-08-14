
import { Knex } from 'knex';

import knex from 'knex';
let initializedClient: Knex | null = null;

export const dockerDb = async (): Promise<Knex> => {
  if (initializedClient) { return initializedClient; }

  const db = knex({
    client: 'pg',
    connection: {
      host: 'db',
      port: 5432,
      user: 'postgres',
      password: 'example',
      database: 'postgres'
    }
  });

  await testConnection(db);
  initializedClient = db;
  return db
};

export const localDb = async (): Promise<Knex> => {
  if (initializedClient) { return initializedClient; }

  const db = knex({
    client: 'pg',
    pool: { min: 0, max: 7 },
    connection: {
      host: '127.0.0.1',
      port: 54320,
      user: 'postgres',
      password: 'example',
      database: 'postgres'
    }
  });

  await testConnection(db);
  initializedClient = db;
  return db;
};

const testConnection = async (db: Knex) => {
  try {
    await db.raw('SELECT 1')
    console.log('Database connection successful')
  } catch (error) {
    console.error('Failed to create database connection:', error);
    throw error;
  }
}