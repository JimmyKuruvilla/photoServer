import { StructuredImageDescriptionResponseJson } from '../libs/models/prompts.ts';

export type SupportedMetadata = {
  htmlType: 'number' | 'text';
  dbType: 'array' | 'scalar' | 'textSearch';
  order: number;
  dbName: keyof (StructuredImageDescriptionResponseJson & { tags: string });
  displayName: string;
};

const UNSORTED_METADATA = [
  { dbType: 'scalar', htmlType: 'number', order: 0, displayName: 'people', dbName: 'humanCount' },
  { dbType: 'scalar', htmlType: 'number', order: 1, displayName: 'kids (<20)', dbName: 'humansUnder20YearsOld' },
  { dbType: 'scalar', htmlType: 'number', order: 2, displayName: 'adults (20-60)', dbName: 'humansBetween20And60YearsOld' },
  { dbType: 'scalar', htmlType: 'number', order: 3, displayName: 'oldies (60+)', dbName: 'humansGreaterThan60YearsOld' },
  { dbType: 'scalar', htmlType: 'number', order: 4, displayName: 'dogs', dbName: 'dogCount' },
  { dbType: 'scalar', htmlType: 'number', order: 5, displayName: 'birds', dbName: 'birdCount' },
  { dbType: 'scalar', htmlType: 'number', order: 6, displayName: 'animals', dbName: 'animalCount' },
  { dbType: 'scalar', htmlType: 'number', order: 7, displayName: 'buildings', dbName: 'buildingCount' },
  { dbType: 'scalar', htmlType: 'number', order: 8, displayName: 'inanimates', dbName: 'inanimateObjectCount' },
  { dbType: 'array', htmlType: 'text', order: 9, displayName: 'colors (csv)', dbName: 'colors' },
  { dbType: 'scalar', htmlType: 'text', order: 10, displayName: 'season', dbName: 'weather' },
  { dbType: 'scalar', htmlType: 'text', order: 11, displayName: 'camera distance', dbName: 'distanceFromSubject' },
  { dbType: 'textSearch', htmlType: 'text', order: 12, displayName: 'description', dbName: 'longDescription' },
  { dbType: 'textSearch', htmlType: 'text', order: 13, displayName: 'whimsical', dbName: 'bogusDescription' },

  // TODO: include tags in metadata search
  // { dbType: 'scalar', htmlType: 'text', order: 0, displayName: 'tags', dbName: 'tags' },
  
  // excluded because it is force combined with longDescription
  // { dbType: 'textSearch', htmlType: 'text', order: 0, displayName: '', dbName: 'emotionalDescription' },
  
  // excluded because it doesn't add any more value than searching on longDescription
  // { dbType: 'textSearch', htmlType: 'text', order: 0, displayName: '', dbName: 'shortDescription' },
  
] satisfies SupportedMetadata[];

export const SUPPORTED_METADATA = [...UNSORTED_METADATA].sort((a, b) => a.order - b.order);
export const METADATA_BY_NAME = Object.fromEntries(UNSORTED_METADATA.map(m => ([m.dbName, m])))
const isEmpty = (str: any) => str === ''

export const parseQuery = (query: any) => {
  return Object.entries(query).reduce<Record<string, any>>((acc, [name, value]) => {
    if (!isEmpty(value)) {
      const metadata = METADATA_BY_NAME[name]
      if (metadata.dbType == 'textSearch') {
        acc.textSearch[name] = value
      } else if (metadata.dbType === 'array') {
        acc.nonTextSearchFields[name] = (value as string).split(',')
      } else if (metadata.htmlType === 'number') {
        acc.nonTextSearchFields[name] = Number(value)
      } else {
        acc.nonTextSearchFields[name] = value
      }
    }
    return acc
  }, { textSearch: {}, nonTextSearchFields: {} })
} 