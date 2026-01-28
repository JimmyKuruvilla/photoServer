import { ImapFlow } from 'imapflow';
import { ParsedMail, simpleParser } from 'mailparser';
import EventEmitter from 'node:events';
import fs from 'node:fs/promises';
import { createLogger } from '../libs/pinologger.ts';
const log = createLogger('[MAIL] ')

const MailEmitter = new EventEmitter();
export const MAIL_STATE_FILE_PATH = './mail.state.json'
export const MAIL_EVENTS = {
  NEW_MAIL: 'NEW_MAIL'
}
export type NewMail = ParsedMail & {
  modseq: bigint | undefined
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

  // Mailbox open/close events
  client.on('mailboxOpen', (mailbox) => {
    log.info(`Opened ${mailbox.path}`);
  });

  client.on('mailboxClose', (mailbox) => {
    log.info(`Closed ${mailbox.path}`);
  });

  setInterval(async () => {
    const mailData = JSON.parse(await fs.readFile(MAIL_STATE_FILE_PATH, 'utf8'))
    const messages = await fetchAll(mailData.lastSeenModSeq)

    for (const message of messages) {
      const mail = await simpleParser(message.source!);
      MailEmitter.emit(MAIL_EVENTS.NEW_MAIL, { modseq: message.modseq, ...mail })
    }

  }, interval)

  return { emitter: MailEmitter, stateFilePath: MAIL_STATE_FILE_PATH, events: MAIL_EVENTS }
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

export const isFrom = (mail: NewMail | ParsedMail, addressesToCheck: string[]) => {
  const mailAddresses = mail?.from?.value.map(v => v.address) ?? []
  return addressesToCheck.some(address => mailAddresses.includes(address))
}