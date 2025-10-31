/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function (knex) {
  return knex.raw(`
    CREATE UNIQUE INDEX tag_value_media_id_unique_idx on media_tags (value, media_id);
    `
  );
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function (knex) {
  return knex.raw(`
    DROP INDEX tag_value_media_id_unique_idx;
    `
  );
};
