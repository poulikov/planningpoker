const levels = {
  error: 'ERROR',
  warn: 'WARN',
  info: 'INFO',
  debug: 'DEBUG',
};

const log = (level: keyof typeof levels, message: string, meta?: any) => {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${levels[level]}]`;

  if (meta) {
    console.log(`${prefix} ${message}`, meta);
  } else {
    console.log(`${prefix} ${message}`);
  }
};

export const logger = {
  error: (message: string, meta?: any) => log('error', message, meta),
  warn: (message: string, meta?: any) => log('warn', message, meta),
  info: (message: string, meta?: any) => log('info', message, meta),
  debug: (message: string, meta?: any) => log('debug', message, meta),
};
