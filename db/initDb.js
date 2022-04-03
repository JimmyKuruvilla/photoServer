const dockerDb = () => {
  return require('knex')({
    client: 'pg',
    connection: {
      host: 'db',
      port: '5432',
      user: 'postgres',
      password: 'example',
      database: 'postgres'
    }
  });
};

const localDb = () => {
  return require('knex')({
    client: 'pg',
    pool: { min: 0, max: 7 },
    connection: {
      host: '127.0.0.1',
      port: '54320',
      user: 'postgres',
      password: 'example',
      database: 'postgres'
    }
  });
};

module.exports = {
  dockerDb,
  localDb
};
