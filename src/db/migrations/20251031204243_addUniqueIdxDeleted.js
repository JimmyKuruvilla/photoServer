export const up = function (knex) {
  return knex.raw(`
    CREATE UNIQUE INDEX deleted_path_hash_unique_idx on deleted (path, hash);
    `
  );
};

export const down = function (knex) {
  return knex.raw(`
    DROP INDEX deleted_path_hash_unique_idx;
    `
  );
};
