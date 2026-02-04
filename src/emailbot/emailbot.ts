import { EMAILS } from '../constants.ts';
import { sendRandomImageEmail } from '../dailyRandom/dailyRandom.ts';
import { initMcpAssist } from '../libs/models/mcpAssist.ts';
import { getModelRespText } from '../libs/models/mcpAssistUtils.ts';
import { v1Chat, v1Responses, v1ResponsesWithMcpAssist } from '../libs/models/models.ts';
import { Prompts } from '../libs/models/prompts.ts';
import { getModelChatRespText } from '../libs/models/utils.ts';
import { createLogger } from '../libs/pinologger.ts';
import { initMailClient, isFrom, NewMail } from './inbox.ts';
import { sendMail } from './outbox.ts';

const log = createLogger('[EMAILBOT]')

const LLM = 'llm'
const SUBJECTS = {
  HELP: 'help',
  CHAT: 'chat',
  HWCAL: 'hwcal',
  SHOPPING: 'shopping',
  RANDOM_IMAGE: 'random image'
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

const isRandomImage = (subject: string | undefined) => {
  return isLLMSubject(subject) && subject?.toLowerCase().includes(SUBJECTS.RANDOM_IMAGE)
}

const main = async () => {
  const { mcpClient, tools } = await initMcpAssist()
  const { emitter, events } = await initMailClient()

  emitter.on(events.NEW_MAIL, async (mail: NewMail) => {
    log.info(`NEW_MAIL ${mail.subject} from ${mail?.from?.text}, uid: ${mail.uid}`)

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

      if (isRandomImage(mail.subject)) {
        try {
          await sendRandomImageEmail({ to: EMAILS.jimmyjk, subject: mail.subject })
        } catch (error: any) {
          log.error(error)
          const mailResp = await sendMail({ to: mail.from.text, subject: mail.subject, text: error.message })
        }
      }
    }
  })
}

main()