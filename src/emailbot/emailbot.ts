import { ParsedMail } from 'mailparser';
import fs from 'node:fs/promises';
import { createLogger } from '../libs/pinologger.ts';
import { fetchAllParsed, initMailClient, isFrom, MAIL_STATE_FILE_PATH, NewMail } from './mail.ts';
import { callModel, Prompts } from '../libs/models/models.ts';
import calendarMCPTools from '../emailbot/calendar-mcp-tools.json' with { type: 'json' };

const log = createLogger('[EMAILBOT] ')
const eliImsa = 'ekuruvilla@imsa.edu'
const eliHome = 'elihomephone@gmail.com'

let lastMailDate;
const main = async () => {
  const { emitter, stateFilePath, events } = await initMailClient(1_000)
  // stateFilePath update with string at path {lastSeenModSeq} from mail.modseq.toString()

  // const mails = await fetchAllParsed('0')
  // for (const mail of mails) {
  //   if (isFrom(mail, ['jimmyjk@gmail.com'])) {
  //     console.log('got a jimmy', mail.subject)
  //   }
  // }
  emitter.once(events.NEW_MAIL, async (mail: NewMail) => { // TODO change to polling
    //   // log.info(mail)
    //   // log.info(mail.date)
    //   // log.info(mail.subject)
    //   // log.info(mail?.to?.text)
    //   // log.info(mail?.from?.text)
    //   // log.info(mail.text)


    //   log.info({ msg: 'got some mail', date: mail.date, modSeq: mail?.modseq?.toString() })

    //   // if already seen, don't send again
    if (isFrom(mail, ['jimmyjk@gmail.com'])) {
      const mailData = JSON.parse(await fs.readFile(MAIL_STATE_FILE_PATH, 'utf8'))
      console.log('got a jimmy', mail.subject)

      console.time('callModel')
      const resp = await callModel({ prompt: Prompts.CreateHWCalendarInvites(mail.text!)})
      // const resp = await callModel({ prompt: Prompts.CreateHWCalendarInvites(mail.text!), tools: calendarMCPTools })
      console.log(resp)
      console.timeEnd('callModel')
      // establish success from model and then update the file record
      // mailData.lastSeenModSeq = mail?.modseq?.toString()
      // await fs.writeFile(MAIL_STATE_FILE_PATH, JSON.stringify(mailData))
    }
  })
}
main()

// TODO 
// // establish success from model and then update the file record
// renew credentials so that they last longer and ensure they last past 1 week from jan 22