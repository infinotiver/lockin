// lib/logger.ts
// basic implementation for logging stuff in dev

const isDev = __DEV__;

export const logger = {
  log: (...args: any[]) => {
    if (isDev) console.log(...args);
  },

  info: (...args: any[]) => {
    if (isDev) console.info(...args);
  },

  warn: (...args: any[]) => {
    if (isDev) console.warn(...args);
  },

  error: (...args: any[]) => {
    if (isDev) console.error(...args);
  },

  debug: (...args: any[]) => {
    if (isDev) console.debug(...args);
  },
};
