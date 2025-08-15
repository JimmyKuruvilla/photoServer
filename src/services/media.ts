import { getListings } from '../listings.ts';

export async function getBeforeAndAfterItems(dbPath: string): Promise<[any, any]> {
  const fullAbsDirPath = dbPath.substring(0, dbPath.lastIndexOf('/'))
  const listings = await getListings(fullAbsDirPath);
  const itemIndex = listings.media.findIndex(m => m.dbPath === dbPath)
  const beforeItem = listings.media[itemIndex - 1 > -1 ? itemIndex - 1 : 0]
  const afterItem = listings.media[itemIndex + 1 < listings.media.length ? itemIndex + 1 : listings.media.length - 1]

  return [beforeItem, afterItem]
}