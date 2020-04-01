exports.up = function(knex) {
  return knex.schema.table('images', function(t) {
    t.boolean('favorite')
      .notNull()
      .defaultTo(false);
  });
};

exports.down = function(knex) {
  return knex.schema.table('images', function(t) {
    t.dropColumn('favorite');
  });
};
