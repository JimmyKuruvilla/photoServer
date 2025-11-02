export const dbConfig = {
  prod: {
    client: 'pg',
    connection: {
      host: 'localhost',
      port: '54320',
      database: 'postgres',
      user: 'postgres',
      password: 'example'
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      directory: 'src/db/migrations',
      tableName: 'knex_migrations'
    }
  },
  test: {
    client: 'pg',
    connection: {
      host: 'localhost',
      port: '54320',
      database: 'test',
      user: 'postgres',
      password: 'example'
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      directory: 'src/db/migrations',
      tableName: 'knex_migrations'
    }
  }
};

export default dbConfig;