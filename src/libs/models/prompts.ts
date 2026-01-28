export const Prompts = {
  GeneralStructuredImagePrompt: `
    Return a list of string tags that would be useful to categorize this image in search.
    Only include each type of tag once. For example close-up, close-up shot and close distance are duplications and should be excluded. 
    All tags should be lowercase in a single comma separated string, no newlines.
    The following is the only tags that must be returned. 
    They are formatted how they should be returned with either a description of the expected return value or a range of allowed values separated by | characters.
    Sample return csv: colors: red:green:blue,humanCount:1, animalCount:0, shortDescription: a boy playing in water etc.
    shortDescription: text describing the image, short and succinct
    longDescription: text describing the image, elaborate description
    colors: names of colors present, 
    weather: summer|winter|fall|spring, 
    distanceFromSubject: close|medium|far
    inanimateObjectCount:number, 
    humanCount:number, 
    animalCount: number,
    dogCount: number,
    birdCount: number 
    buildingCount: number, 
    humansUnder20YearsOld:number,
    humansBetween20And60YearsOld:number,
    humansGreaterThan60YearsOld:number,
    `,
  NumFacesPrompt: `
    Return the number of faces detected in this image. Return in a structured format as parseable json that looks like {faces: countOfFacesDetected}
    `,
  CreateHWCalendarInvites: (email: string) => `
  1. Check the current time.
  2. Take this email of homework items that are due and create calendar invites on the 'normal' account for each item. 
  3. Set an event the day each item is due called 'Turn in X' where X is the assignment name.
  4. Add jimmyjk@gmail.com as an invitee for each item.
  If the invite exists already, do not recreate it.
  If the email is not about homework and due dates, do nothing.
  Return the text: TASK_COMPLETED if successful or TASK_FAILED if not.
  email: ${email}
  `
}
