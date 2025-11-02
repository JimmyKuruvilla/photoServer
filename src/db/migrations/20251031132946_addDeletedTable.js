export const up = function (knex) {
  return knex.raw(`
   CREATE TABLE IF NOT EXISTS deleted
    (
      id SERIAL PRIMARY KEY,
      hash TEXT NOT NULL,
      path TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    );

  CREATE INDEX deleted_hash_idx on deleted (hash);
    `
  );
};

export const down = function (knex) {
  return knex.raw(`
     DROP TABLE IF EXISTS deleted;
  `)
};
