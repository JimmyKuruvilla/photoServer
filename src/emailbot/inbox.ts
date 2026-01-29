import { ImapFlow } from 'imapflow';
import { ParsedMail, simpleParser } from 'mailparser';
import EventEmitter from 'node:events';
import fs from 'node:fs/promises';
import { createLogger } from '../libs/pinologger.ts';
import { string } from 'zod/v4';
const log = createLogger('[INBOX]')

const InboxEmitter = new EventEmitter();
export const MAIL_STATE_FILE_PATH = process.env.MAIL_STATE_FILE_PATH ?? './mail.state.json'
export const MAIL_EVENTS = {
  NEW_MAIL: 'NEW_MAIL'
}
export type NewMail = ParsedMail & {
  modSeq: string
}

const client: ImapFlow = new ImapFlow({
  host: 'imap.gmail.com',
  port: 993,
  secure: true,
  auth: {
    user: process.env.EMAILBOT_USERNAME!,
    pass: process.env.EMAILBOT_PASSWORD!
  },
  logger: false
});

export const initMailClient = async (interval: number = 15_000) => {
  await client.connect();
  log.info('MailClient connected successfully');

  client.on('close', async () => {
    log.info('Connection closed');
    // Implement reconnection logic here
  });

  client.on('error', (err) => {
    console.error('Connection error:', err);
  });

  // Mailbox events (only when mailbox is selected)
  client.on('exists', (data) => {
    log.info(`New message count: ${data.count}`);
  });

  client.on('expunge', (data) => {
    log.info(`Message ${data.seq} was deleted`);
  });

  client.on('flags', (data) => {
    log.info(`Flags changed for message ${data.seq}`);
  });

  client.on('mailboxOpen', (mailbox) => {
    log.info(`Opened ${mailbox.path}`);
  });

  client.on('mailboxClose', (mailbox) => {
    log.info(`Closed ${mailbox.path}`);
  });

  setInterval(fetchAndEmit, interval)

  return { emitter: InboxEmitter, events: MAIL_EVENTS }
}

export const fetchAndEmit = async () => {
  const mailData = JSON.parse(await fs.readFile(MAIL_STATE_FILE_PATH, 'utf8'))
  log.debug(`Fetching from lastSeenModSeq: ${mailData.lastSeenModSeq}`)
  const messages = await fetchAll(mailData.lastSeenModSeq)


  for (const message of messages) {
    const mail = await simpleParser(message.source!);
    InboxEmitter.emit(MAIL_EVENTS.NEW_MAIL, { modSeq: message.modseq?.toString(), ...mail })
  }
}

/*
* Sync nonstreaming fetch of whole inbox
* 1:* means from 1 to latest
* mailstate.json contains a BigInt of the last modseq processed
*/
export const fetchAll = async (modSeq: string) => {
  let lock = await client.getMailboxLock('INBOX');
  try {
    const messages = await client.fetchAll('1:*',
      { envelope: true, source: true },
      { changedSince: BigInt(modSeq) });
    return messages;
  } finally {
    lock.release();
  }
}

export const fetchAllParsed = async (modSeq: string) => {
  const messages = await fetchAll(modSeq)
  const mails = []
  for (const message of messages) {
    const mail = await simpleParser(message.source!);
    mails.push(mail)
  }
  return mails;
}

export const getMailData = async () => JSON.parse(await fs.readFile(MAIL_STATE_FILE_PATH, 'utf8'))

type WriteMailDataParams = {
  lastSeenModSeq: string;
  lastSeenDate: string;
  from: string;
  subject: string;
}
export const writeMailData = async (data: WriteMailDataParams) => {
  await fs.writeFile(MAIL_STATE_FILE_PATH, JSON.stringify(data))
}

export const isFrom = (mail: NewMail | ParsedMail, addressesToCheck: string[]) => {
  const mailAddresses = mail?.from?.value.map(v => v.address) ?? []
  return addressesToCheck.some(address => mailAddresses.includes(address))
}