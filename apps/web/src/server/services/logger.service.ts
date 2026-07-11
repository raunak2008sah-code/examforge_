import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  base: {
    pid: process.pid,
    env: process.env.NODE_ENV,
  },
  transport: process.env.NODE_ENV !== 'production' ? {
    target: 'pino-pretty',
    options: {
      colorize: true
    }
  } : undefined,
});

export class LoggerService {
  static info(message: string, obj?: any) {
    logger.info(obj || {}, message);
  }
  static error(message: string, obj?: any) {
    logger.error(obj || {}, message);
  }
  static warn(message: string, obj?: any) {
    logger.warn(obj || {}, message);
  }
  static debug(message: string, obj?: any) {
    logger.debug(obj || {}, message);
  }
}
