const initDb = () => {
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
  initDb
};
