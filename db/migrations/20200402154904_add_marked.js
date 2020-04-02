exports.up = function (knex) {
  return knex.schema.table('images', function (t) {
    t.boolean('marked')
      .notNull()
      .defaultTo(false);
  });
};

exports.down = function (knex) {
  return knex.schema.table('images', function (t) {
    t.dropColumn('marked');
  });
};
