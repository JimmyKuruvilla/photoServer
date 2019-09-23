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
    connection: {
      host: '0.0.0.0',
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
