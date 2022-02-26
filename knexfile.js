// Update with your config settings.

module.exports = {

  development: {
    client: 'postgresql',
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
      directory: 'db/migrations',
      tableName: 'knex_migrations'
    }
  }

};
