import { ParsedMail } from 'mailparser';
import fs from 'node:fs';
import { createLogger } from '../libs/pinologger.ts';
import { fetchAllParsed, fetchAndEmit, getMailData, initMailClient, isFrom, MAIL_STATE_FILE_PATH, NewMail, writeMailData } from './inbox.ts';
import { v1Chat, v1Responses, v1ResponsesWithMcpAssist } from '../libs/models/models.ts';
import { Prompts } from '../libs/models/prompts.ts';
import { sendMail } from './outbox.ts';
import { ModelResponse } from '../libs/models/types.ts';
import { initMcpAssist } from '../libs/models/mcpAssist.ts';
import { getModelRespText } from '../libs/models/mcpAssistUtils.ts';
import { getModelChatRespText } from '../libs/models/utils.ts';

/*
TODO
1. recover from disconnection
 * 1. email me a picture from local file system and describe it
 * 2. mcp server for accessing photo website, get a random and describe it in email
 * add extra fields to photo descriptions and rerun it. Expose those in the photo site behind a query param. 
*/
const log = createLogger('[EMAILBOT]')
const EMAILS = {
  jchomephone: 'jchomephone@gmail.com',
  jimmyjk: 'jimmyjk@gmail.com',
  eliImsa: 'ekuruvilla@imsa.edu',
  eliHome: 'elihomephone@gmail.com'
}

const LLM = 'llm'
const SUBJECTS = {
  HELP: 'help',
  CHAT: 'chat',
  HWCAL: 'hwcal',
  SHOPPING: 'shopping'
}

const isLLMSubject = (subject: string | undefined) => {
  return subject?.toLowerCase().includes(LLM)
}

const isHelp = (subject: string | undefined) => {
  return isLLMSubject(subject) && subject?.toLowerCase().includes(SUBJECTS.HELP)
}

const isChat = (subject: string | undefined) => {
  return isLLMSubject(subject) && subject?.toLowerCase().includes(SUBJECTS.CHAT)
}

const isHomeworkCalendar = (subject: string | undefined) => {
  return isLLMSubject(subject) && subject?.toLowerCase().includes(SUBJECTS.HWCAL)
}

const isShoppingList = (subject: string | undefined) => {
  return isLLMSubject(subject) && subject?.toLowerCase().includes(SUBJECTS.SHOPPING)
}

const main = async () => {
  const { mcpClient, tools } = await initMcpAssist()
  const { emitter, events } = await initMailClient(30_000)

  emitter.on(events.NEW_MAIL, async (mail: NewMail) => {
    log.info(`NEW_MAIL ${mail.subject} from ${mail?.from?.text}`)
    await writeMailData({
      lastSeenModSeq: mail.modSeq,
      lastSeenDate: mail.date!.toString(),
      from: mail.from!.text,
      subject: mail.subject!
    })

    if (mail?.from?.text && mail?.subject && !isFrom(mail, [EMAILS.jchomephone])) {
      if (isHelp(mail.subject)) {
        try {
          const mailResp = await sendMail({ to: mail.from.text, subject: mail.subject, text: `You can use these subjects prefixed with 'llm': ${Object.values(SUBJECTS).join('\n')}` })
        } catch (error: any) {
          log.error(error)
          const mailResp = await sendMail({ to: mail.from.text, subject: mail.subject, text: error.message })
        }
      }

      if (isChat(mail.subject)) {
        try {
          const resp = await v1Responses({ prompt: Prompts.LLMChat(mail.text!) })
          const mailResp = await sendMail({ to: mail.from.text, subject: mail.subject, text: `${getModelRespText(resp)}\n You asked: ${mail.text}` })
        } catch (error: any) {
          log.error(error)
          const mailResp = await sendMail({ to: mail.from.text, subject: mail.subject, text: error.message })
        }
      }

      if (isHomeworkCalendar(mail.subject)) {
        try {
          const resp = await v1ResponsesWithMcpAssist(
            mcpClient,
            {
              tools,
              prompt: Prompts.CreateHWCalendarInvites(mail.text!),
            })
          const mailResp = await sendMail({ to: mail.from.text, subject: mail.subject, text: `${getModelRespText(resp)}\n You asked: ${mail.text}` })
        } catch (error: any) {
          log.error(error)
          const mailResp = await sendMail({ to: mail.from.text, subject: mail.subject, text: error.message })
        }
      }

      if (isShoppingList(mail.subject)) {
        try {
          const resp = await v1Chat({ prompt: Prompts.ReorganizeShoppingIntoSectors(mail.text!), })
          const mailResp = await sendMail({ to: mail.from.text, subject: mail.subject, text: `${getModelChatRespText(resp)}\n You asked: ${mail.text}` })
        } catch (error: any) {
          log.error(error)
          const mailResp = await sendMail({ to: mail.from.text, subject: mail.subject, text: error.message })
        }
      }
    }
  })

  await fetchAndEmit();

}
main()