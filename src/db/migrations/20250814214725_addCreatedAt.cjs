
exports.up = function (knex) {
  return knex.raw(`
    alter table images add column created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();`
  );
};

exports.down = function (knex) {
  return knex.raw(`
    alter table images drop column created_at`
  );
};
