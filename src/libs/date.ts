/*
 * filepaths: we want them in the user's local date
*/

/*
 * returns 2023-05-24 given Date or date string
 * Convert to local string because UTC time can be off by a day depending on the time
*/
export const formatToLocalDateString = (dateStr: string | Date) => {
  const [month, date, year] = new Date(dateStr).toLocaleDateString().split('/');
  return `${year}-${month.padStart(2, '0')}-${date.padStart(2, '0')}`;
}