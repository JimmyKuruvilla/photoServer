export const up = function (knex) {
  return knex.raw(`
    create table if not exists image_tags(
      id serial PRIMARY KEY,
      created_at timestamptz not null default now(),
      value text not null,
      images_id int not null,
      constraint fk_images_tags_images_id 
      foreign key(images_id) references images(id) on delete cascade
    );

    create index images_id_idx on image_tags (images_id);
  `);
};

export const down = function (knex) {
  
};
