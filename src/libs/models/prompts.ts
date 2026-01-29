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
  All times should be in CST - central standard time timezone. 
  Take this email of items that are due and create calendar events on the 'primary' account for each item. 
  If a time is given use that as the start time for the event. If no time is given start them at 0700am and last 30 minutes.
  Determine what date each event is due, then set a calendar event on that date for each item called 'Turn in X' where X is the assignment name. 
  If a due time is Friday, ensure the date you are setting the event for is also a Friday.
  Add jimmyjk@gmail.com as an invitee for each item.
  Do not create an event if it already exists. 
  Overlapping events are acceptable. 
  if successful return the list of event names and their date + times, if failed return the reason why it failed.
  email: ${email}
  `,
  LLMChat: (query: string) => `Answer the question below as best as you can with the info you have. 
  Don't ask any follow up questions. This is a one question to one response type conversation.
  query: ${query}`
}
