import { ParsedMail } from 'mailparser';
import fs from 'node:fs';
import { createLogger } from '../libs/pinologger.ts';
import { fetchAllParsed, fetchAndEmit, getMailData, initMailClient, isFrom, MAIL_STATE_FILE_PATH, NewMail, writeMailData } from './inbox.ts';
import { callModel, callModelWithMcp } from '../libs/models/models.ts';
import { Prompts } from '../libs/models/prompts.ts';
import { sendMail } from './outbox.ts';
import { ModelResponse } from '../libs/models/types.ts';
import { initMcpAssist } from '../libs/models/mcpAssist.ts';

const log = createLogger('[EMAILBOT]')
const EMAILS = {
  jchomephone: 'jchomephone@gmail.com',
  jimmyjk: 'jimmyjk@gmail.com',
  eliImsa: 'ekuruvilla@imsa.edu',
  eliHome: 'elihomephone@gmail.com'
}

const isLLMSubject = (subject: string | undefined) => {
  return subject?.toLowerCase().includes('llm')
}
const isChat = (subject: string | undefined) => {
  return isLLMSubject(subject) && subject?.toLowerCase().includes('chat')
}

const isHomeworkCalendar = (subject: string | undefined) => {
  return isLLMSubject(subject) && subject?.toLowerCase().includes('hwcal')
}

const getModelRespText = (response: ModelResponse) => {
  return response?.output?.flatMap(o =>
    o?.content?.flatMap(
      c => c?.text
    )
  ).join(',')
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
      if (isChat(mail.subject)) {
        try {
          const resp = await callModel({ prompt: Prompts.LLMChat(mail.text!) })
          const mailResp = await sendMail({ to: mail.from.text, subject: mail.subject, text: `${getModelRespText(resp)}\n You asked: ${mail.text}` })
        } catch (error: any) {
          log.error(error)
          const mailResp = await sendMail({ to: mail.from.text, subject: mail.subject, text: error.message })
        }
      }

      if (isHomeworkCalendar(mail.subject)) {
        try {
          const resp = await callModelWithMcp(
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
    }
  })

  await fetchAndEmit();

}
main()

// renew credentials so that they last longer and ensure they last past 1 week from jan 22