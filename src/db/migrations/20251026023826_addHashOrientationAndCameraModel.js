/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function(knex) {
    return knex.raw(`
    alter table images add column hash TEXT NULL;
    alter table images add column orientation INT NULL;
    alter table images add column model TEXT NULL;
    `
  );
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function(knex) {
    return knex.raw(`
    alter table images drop column hash;
    alter table images drop column orientation;
    alter table images drop column model;
    `
  );
};

