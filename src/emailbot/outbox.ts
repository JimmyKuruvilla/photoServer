
import nodemailer from 'nodemailer'
import { createLogger } from '../libs/pinologger.ts';
import { Attachment } from 'nodemailer/lib/mailer/index.js';
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
  { from, to, subject, text, attachments }:
    { from?: string, to: string, subject: string, text: string, attachments?: Attachment[] }
) => {
  const info = await transporter.sendMail({
    from: from ?? '"EmailBot"" <jchomephone@gmail.com>',
    to,
    subject,
    text,
    ...(attachments?.length ? { attachments } : null)
  });

  if (info.accepted.length) {
    log.info(`Mail sent to ${to}`)
  } else {
    log.error(`Mail rejected to :${info.rejected.join(',')}`)
  }
  return info
}
