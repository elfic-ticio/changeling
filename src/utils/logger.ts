import process from 'node:process';

const ANSI = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

let debugEnabled = false;

export function setDebug(enabled: boolean): void {
  debugEnabled = enabled;
}

function colorize(text: string, color: string): string {
  return process.stdout.isTTY ? `${color}${text}${ANSI.reset}` : text;
}

export const logger = {
  info(message: string): void {
    console.log(colorize(message, ANSI.cyan));
  },

  warn(message: string): void {
    console.warn(colorize(`warn: ${message}`, ANSI.yellow));
  },

  error(message: string): void {
    console.error(colorize(`error: ${message}`, ANSI.red));
  },

  debug(message: string): void {
    if (!debugEnabled && !process.env['DEBUG']) return;
    console.log(colorize(`debug: ${message}`, ANSI.gray));
  },
};
