import { log } from '../libs/log.ts';
import { DirList, getListings } from './listings.ts';
export const DirListingCache = new Map()

export async function getBeforeAndAfterItems(dbPath: string): Promise<[any, any]> {
  const fullAbsDirPath = dbPath.substring(0, dbPath.lastIndexOf('/'))
  let listings: DirList;
  if (DirListingCache.has(fullAbsDirPath)) {
    listings = DirListingCache.get(fullAbsDirPath)
  } else {
    listings = await getListings(fullAbsDirPath)
    DirListingCache.set(fullAbsDirPath, listings)
  }

  log(`DirListingCache: ${DirListingCache.size} ${[...DirListingCache.keys()]}`)
  const itemIndex = listings.media.findIndex(m => m.dbPath === dbPath)
  const beforeItem = listings.media[itemIndex - 1 > -1 ? itemIndex - 1 : 0]
  const afterItem = listings.media[itemIndex + 1 < listings.media.length ? itemIndex + 1 : listings.media.length - 1]

  return [beforeItem, afterItem]
}