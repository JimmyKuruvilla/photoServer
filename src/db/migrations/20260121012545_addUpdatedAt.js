
export const up = function (knex) {
  return knex.raw(`
    alter table media add column updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();`
  );
};

export const down = function (knex) {
  return knex.raw(`
    alter table media drop column updated_at`
  );
};
