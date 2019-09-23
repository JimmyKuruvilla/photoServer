CREATE TABLE images
(
  id SERIAL PRIMARY KEY,
  path text UNIQUE
);

-- Indices -------------------------------------------------------

CREATE UNIQUE INDEX images_pkey ON images(id
int4_ops);
CREATE UNIQUE INDEX images_path_key ON images(path
text_ops);
