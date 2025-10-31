const __dirname = import.meta.dirname;
export const filesStr = 'files';
export const dirsStr = 'dirs';
export const mediaStr = 'media';
export const port = 4000;
export const defaultInterval = 6000;
export const NL = '\n';
export const ONE_DAY_SECS = 86400;
export const IGNORE_PREFIX = '__'

export const TABLES = {
  MEDIA: 'media',
  MEDIA_TAGS: 'media_tags',
  DELETED: 'deleted'
} as const;

export type TableName = typeof TABLES[keyof typeof TABLES];

export const SERVED_PATH = process.env.MEDIA_PATH || __dirname;