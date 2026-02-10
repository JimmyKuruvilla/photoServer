
export const up = function (knex) {
  return knex.raw(`
    ALTER TABLE media ADD COLUMN captured_at timestamptz;
    `
  );
};

export const down = function (knex) {
  return knex.raw(`
    ALTER TABLE media DROP COLUMN captured_at;`
  );
};
