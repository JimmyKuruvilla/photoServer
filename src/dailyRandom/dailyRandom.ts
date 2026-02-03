#!/usr/bin/env tsx

import { EMAILS, JUBUNTUS_ORIGIN } from '../constants.ts';
import { sendMail } from '../emailbot/outbox.ts';
import { getImageDescriptors } from '../libs/imageDescriptors.ts';
import { createLogger } from '../libs/pinologger.ts';
const log = createLogger('[DAILY_RANDOM')

/* crontab -e 
* 0 6-21/3 * * * (every 3 hours between 6am and 9pm)
* Send me an email with a random image
*/

export const sendRandomImageEmail = async ({ to, subject }: { to: string, subject?: string }) => {
  const resp = await fetch(`${JUBUNTUS_ORIGIN}/random?type=image`)
  const json = await resp.json()
  const filePath = json.dbPath;
  const description = await getImageDescriptors(filePath)

  if (description) {
    await sendMail({
      to: EMAILS.jimmyjk,
      subject: subject ?? 'Random Image',
      text: description.longDescription,
      attachments: [{ path: filePath }]
    })
  }
}

if (import.meta.main) {
  await sendRandomImageEmail({ to: EMAILS.jimmyjk });
}
