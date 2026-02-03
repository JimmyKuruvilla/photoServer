import path from 'node:path';
import { log } from '../libs/log.ts';
import { DirList, getListings } from './listings.ts';
import { DbMediaWithTags } from '../db.ts';
export const DirListingCache = new Map()
export const PrefetchedRandoms: {
  image: DbMediaWithTags[],
  video: DbMediaWithTags[]
} = { image: [], video: [] };

export const encacheListings = async (dbPaths: string[]) => {
  await Promise.all(dbPaths.map(async dbPath => {
    const dirPath = path.dirname(dbPath)
    const listings = await getListings(dirPath)
    DirListingCache.set(dirPath, listings)
  }))
  log(`encacheListings:: DirListingCache: ${DirListingCache.size}`)
}

export async function getBeforeAndAfterItems(dbPath: string): Promise<[any, any]> {
  const dirPath = path.dirname(dbPath)
  let listings: DirList;
  if (DirListingCache.has(dirPath)) {
    listings = DirListingCache.get(dirPath)
  } else {
    listings = await getListings(dirPath)
    DirListingCache.set(dirPath, listings)
  }

  log(`getBeforeAndAfterItems:: DirListingCache: ${DirListingCache.size}`)
  const itemIndex = listings.media.findIndex(m => m.dbPath === dbPath)
  const beforeItem = listings.media[itemIndex - 1 > -1 ? itemIndex - 1 : 0]
  const afterItem = listings.media[itemIndex + 1 < listings.media.length ? itemIndex + 1 : listings.media.length - 1]

  return [beforeItem, afterItem]
}