import pino from 'pino';
export const createLogger = (prefix: string) => pino({
  msgPrefix: `${prefix} `,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true
    }
  }
})