export enum LogLevel {
  SILENT = 'silent',
  FATAL = 'fatal',
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  TRACE = 'trace',
}

export enum LogContent {
  META = 'meta',
  PARAMS = 'params',
  USER = 'user',
  HEADERS = 'headers',
  REQ_BODY = 'req-body',
  RES_BODY = 'res-body',
}

export enum LogFormat {
  PRETTY = 'pretty',
  RAW = 'raw',
}
