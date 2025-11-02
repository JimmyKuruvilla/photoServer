export const up = function (knex) {
  return knex.schema.table('images', function(t) {
    t.boolean('favorite')
      .notNull()
      .defaultTo(false);
  });
};

export const down = function (knex) {
  return knex.schema.table('images', function(t) {
    t.dropColumn('favorite');
  });
};
