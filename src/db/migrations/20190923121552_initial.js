

export const up = function (knex) {
  return knex.raw(
    `
CREATE TABLE IF NOT EXISTS images
  (
    id SERIAL PRIMARY KEY,
    path text UNIQUE
  );
`
  )
};

export const down = function (knex) {

};
