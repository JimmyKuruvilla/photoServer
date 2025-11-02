export const up = function (knex) {
  return knex.schema.table('images', function (t) {
    t.boolean('marked')
      .notNull()
      .defaultTo(false);
  });
};

export const down = function (knex) {
  return knex.schema.table('images', function (t) {
    t.dropColumn('marked');
  });
};
