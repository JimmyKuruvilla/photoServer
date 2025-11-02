
// converts from '2023:05:27 18:52:01' to 2023-05-27
export const getFolderNameFromExifCreationTime = (exifCreationTime: string) => {
  return exifCreationTime.split(' ')[0].replaceAll(':', '-')
}

// 2023-08-25T09:10:05.832Z to 2023-08-25
export const getFolderNameFromFileStatBirthTime = (birthtime: Date) => {
  return birthtime.toISOString().split('T')[0]
}

// converts to from '2023-05-24T22:39:31.000000Z' to 2023-05-24
export const getFolderNameFromFFProbeCreationTime = (ffProbeCreationTime: string) => {
  return formatToLocalDateString(ffProbeCreationTime)
}

// returns 2023-05-24 given UTC date
export const formatToLocalDateString = (isoDateStr: string) => {
  const [month, date, year] = new Date(isoDateStr).toLocaleDateString().split('/');
  return `${year}-${month.padStart(2, '0')}-${date.padStart(2, '0')}`;
}