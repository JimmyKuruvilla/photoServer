
export const up = function (knex) {
  return knex.raw(`
    ALTER TABLE media ADD COLUMN metadata JSONB;
    `
  );
};

export const down = function (knex) {
  return knex.raw(`
    ALTER TABLE media drop column metadata;`
  );
};
