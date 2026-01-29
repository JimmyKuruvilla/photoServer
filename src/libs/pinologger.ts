import pino from 'pino';
export const createLogger = (prefix: string) => pino({
  level: process.env.LOG_LEVEL ?? 'debug',
  msgPrefix: `${prefix} `,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true
    }
  }
})