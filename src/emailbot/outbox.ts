
import nodemailer from 'nodemailer'
import { createLogger } from '../libs/pinologger.ts';
/*
* https://nodemailer.com/usage/using-gmail
*/

const log = createLogger('[OUTBOX]')

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAILBOT_USERNAME!,
    pass: process.env.EMAILBOT_PASSWORD!
  },
});

export const sendMail = async (
  { from, to, subject, text }:
    { from?: string, to: string, subject: string, text: string }
) => {
  const info = await transporter.sendMail({
    from: from ?? '"EmailBot"" <jchomephone@gmail.com>',
    to,
    subject,
    text
  });

  if (info.accepted.length) {
    log.info(`Mail sent to ${to}`)
  } else {
    log.error(`Mail rejected to :${info.rejected.join(',')}`)
  }
  return info
}
