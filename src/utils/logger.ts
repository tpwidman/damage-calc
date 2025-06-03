export enum LogLevel {
  NONE = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4
}

const LOG_LEVEL = process.env.LOG_LEVEL ? parseInt(process.env.LOG_LEVEL) : LogLevel.NONE;

export function logDebug(message: string, ...args: any[]): void {
  if (LOG_LEVEL >= LogLevel.DEBUG) {
    console.log(`DEBUG: ${message}`, ...args);
  }
}

export function logInfo(message: string, ...args: any[]): void {
  if (LOG_LEVEL >= LogLevel.INFO) {
    console.log(`INFO: ${message}`, ...args);
  }
}

export function logWarn(message: string, ...args: any[]): void {
  if (LOG_LEVEL >= LogLevel.WARN) {
    console.warn(`WARN: ${message}`, ...args);
  }
}

export function logError(message: string, ...args: any[]): void {
  if (LOG_LEVEL >= LogLevel.ERROR) {
    console.error(`ERROR: ${message}`, ...args);
  }
}