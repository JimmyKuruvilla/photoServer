
export const up = function (knex) {
  return knex.raw(`
    ALTER TABLE media ADD COLUMN media_type TEXT CHECK (media_type IN ('image', 'video'));
    CREATE INDEX IF NOT EXISTS media_media_type_idx ON media (media_type);`
  );
};

export const down = function (knex) {
  return knex.raw(`
    ALTER TABLE media drop column media_type;`
  );
};
