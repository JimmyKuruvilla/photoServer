const __dirname = import.meta.dirname;
export const filesStr = 'files';
export const dirsStr = 'dirs';
export const mediaStr = 'media';
export const port = 4000;
export const defaultInterval = 6000;
export const NL = '\n';
export const ONE_DAY_SECS = 86400;
export const ONE_HOUR_SECS = 3600;
export const IGNORE_PREFIX = '__'
export const IMAGE = 'image'
export const VIDEO = 'video'

export const TABLES = {
  MEDIA: 'media',
  MEDIA_TAGS: 'media_tags',
  DELETED: 'deleted'
} as const;

const HASH = { HASH: 'hash', }
const PATH = { PATH: 'path', }

const COMMON_COLS = {
  ID: 'id',
  CREATED_AT: 'created_at',
}

export const COLS = {
  MEDIA: {
    ...COMMON_COLS,
    ...PATH,
    ...HASH,
    UPDATED_AT: 'updated_at',
    FAVORITE: 'favorite',
    MEDIA_TYPE: 'media_type',
    THUMBNAIL: 'thumbnail',
    MARKED: 'marked',
    FACE_COUNT: 'face_count',
    ORIENTATION: 'orientation',
    MODEL: 'model'
  },
  MEDIA_TAGS: {
    ...COMMON_COLS,
    VALUE: 'value',
    MEDIA_ID: 'media_id',
  },
  DELETED: {
    ...COMMON_COLS,
    ...HASH,
    ...PATH,
  }
}

export const TAGS = {
  FAVORITE: 'favorite',
  MARKED: 'marked'
}
export type TableName = typeof TABLES[keyof typeof TABLES];

export const SERVED_PATH = process.env.MEDIA_PATH || __dirname;