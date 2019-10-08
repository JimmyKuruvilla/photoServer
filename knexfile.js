// Update with your config settings.

module.exports = {

  development: {
    client: 'postgresql',
    connection: {
      host: 'db',
      port: '5432',
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
