const base = ({ database, port, debug }) => ({
  client: 'pg',
  debug: debug ?? false,
  connection: {
    database,
    host: 'localhost',
    port: port ?? '54320',
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
})

export const dbConfig = {
  local: base({ database: 'local', port: 5432, debug: true }),
  prod: base({ database: 'postgres', }),
  test: base({ database: 'test' }),
};

export default dbConfig;