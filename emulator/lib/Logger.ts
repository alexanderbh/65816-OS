enum LOG_LEVEL {
  DEBUG = 0,
  INFO = 1,
}

const log_level: LOG_LEVEL = LOG_LEVEL.INFO;

export const log = {
  debug: (m: string) => log_level <= LOG_LEVEL.DEBUG && console.log(m),
  info: (m: string) => log_level <= LOG_LEVEL.INFO && console.log(m),
};
