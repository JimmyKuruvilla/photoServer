export const up = function (knex) {
  return knex.schema.table('images', function (t) {
    t.text('thumbnail');
  });
};

export const down = function (knex) {
  return knex.schema.table('images', function (t) {
    t.dropColumn('thumbnail');
  });
};
