export const up = function (knex) {
  return knex.raw(`
    alter table images add column face_count int;
  `);
};

export const down = function (knex) {
  return knex.raw(`alter table images drop column face_count;`)
};
