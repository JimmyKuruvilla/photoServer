exports.up = function (knex) {
  return knex.schema.table('images', function (t) {
    t.text('thumbnail');
  });
};

exports.down = function (knex) {
  return knex.schema.table('images', function (t) {
    t.dropColumn('thumbnail');
  });
};
