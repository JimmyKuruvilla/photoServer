/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function (knex) {
  return knex.raw(`
    ALTER TABLE image_tags RENAME COLUMN images_id TO media_id;
    ALTER TABLE image_tags RENAME TO media_tags;
    ALTER TABLE images RENAME TO media;
    `
  );
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function (knex) {
  return knex.raw(`
     ALTER TABLE media_tags RENAME COLUMN media_id TO images_id;
     ALTER TABLE media_tags RENAME TO image_tags;
     ALTER TABLE media RENAME TO images;
  `)
};
