import { SERVED_PATH } from '../constants.ts';
import { getListings } from '../listings.ts';

export async function getBeforeAndAfterItems(fullPath: string): Promise<[any, any]> {
  const fullAbsDirPath = fullPath.substring(0, fullPath.lastIndexOf('/'))
  const listings = await getListings(SERVED_PATH, fullAbsDirPath);
  const itemIndex = listings.media.findIndex(m => m.fullPath === fullPath)
  const beforeItem = listings.media[itemIndex - 1 > -1 ? itemIndex - 1 : 0]
  const afterItem = listings.media[itemIndex + 1 < listings.media.length ? itemIndex + 1 : listings.media.length - 1]

  return [beforeItem, afterItem]
}