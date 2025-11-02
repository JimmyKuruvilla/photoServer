export const up = function (knex) {
  return knex.raw(`
    ALTER TABLE media DROP COLUMN favorite;
    ALTER TABLE media DROP COLUMN marked;
    `
  );
};

export const down = function (knex) {
  return knex.schema.table('media', function (t) {
    t.boolean('favorite')
      .notNull()
      .defaultTo(false);
  }).table('images', function (t) {
    t.boolean('marked')
      .notNull()
      .defaultTo(false);
  });
};
