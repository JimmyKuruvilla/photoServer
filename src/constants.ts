export const filesStr = 'files';
export const dirsStr = 'dirs';
export const mediaStr = 'media';
export const port = 4000;
export const defaultInterval = 6000;
export const NL = '\n';

export const TABLES = {
  IMAGES: 'images',
  TAGS: 'image_tags'
} as const;

export type TableName = typeof TABLES[keyof typeof TABLES];

export const WEB_ROOT_PATH = process.env.MEDIA_PATH || __dirname;