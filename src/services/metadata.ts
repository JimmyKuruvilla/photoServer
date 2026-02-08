import { StructuredImageDescriptionResponseJson } from '../libs/models/prompts.ts';

export type SupportedMetadata = {
  type: 'number' | 'text';
  order: number;
  name: keyof StructuredImageDescriptionResponseJson;
};

const UNSORTED_METADATA = [
  { type: 'number', order: 0, name: 'dogCount' },
  { type: 'number', order: 0, name: 'birdCount' },
  { type: 'number', order: 0, name: 'humanCount' },
  { type: 'number', order: 0, name: 'animalCount' },
  { type: 'number', order: 0, name: 'buildingCount' },
  { type: 'number', order: 0, name: 'inanimateObjectCount' },
  { type: 'number', order: 0, name: 'humansUnder20YearsOld' },
  { type: 'number', order: 0, name: 'humansGreaterThan60YearsOld' },
  { type: 'number', order: 0, name: 'humansBetween20And60YearsOld' },
  { type: 'text', order: 0, name: 'colors' }, // array in jsonb 
  { type: 'text', order: 0, name: 'weather' },
  { type: 'text', order: 0, name: 'longDescription' },
  { type: 'text', order: 0, name: 'bogusDescription' },
  { type: 'text', order: 0, name: 'shortDescription' },
  { type: 'text', order: 0, name: 'distanceFromSubject' },
  { type: 'text', order: 0, name: 'emotionalDescription' },
] satisfies SupportedMetadata[];

export const SUPPORTED_METADATA = [...UNSORTED_METADATA].sort((a, b) => b.order - a.order);