import { LoggerModuleAsyncParams, Params } from 'nestjs-pino'
import { LogContent, LogFormat, LogLevel } from './types'

export * from './types'

function initTransport(
  environment: string,
  level: LogLevel,
  format: LogFormat,
  content: LogContent[],
): any {
  if (format == LogFormat.PRETTY) {
    let messageFormat = ''
    if (content.includes(LogContent.META)) {
      messageFormat += '{req.meta.id} - {req.meta.method} {req.meta.url} '
    }
    if (content.includes(LogContent.USER)) {
      messageFormat += '{req.user.roles} '
    }
    messageFormat += '{res.statusCode} ({responseTime}ms): {msg}'

    return {
      target: 'pino-pretty',
      options: {
        colorize: true,
        timestampKey: null,
        messageFormat,
        hideObject: level !== LogLevel.TRACE,
        sync: environment === 'test',
      },
    }
  }
}

function extractUser(req: any) {
  const auth = req?.headers?.authorization
  if (typeof auth === 'string' && auth.startsWith('Bearer')) {
    const [, token] = auth.split(' ')
    const [, user] = token.split('.')
    const parsed = Buffer.from(user, 'base64').toString()
    return JSON.parse(parsed)
  }
}

function requestSerializer(logContent: LogContent[]) {
  const serializers: ((req: any, log: any) => any)[] = []
  if (logContent.includes(LogContent.META)) {
    serializers.push((req: any, log: any) => {
      log.meta ??= {}
      log.meta.id = req.id
      log.meta.url = req.url
      log.meta.method = req.method
    })
  }
  if (logContent.includes(LogContent.PARAMS)) {
    serializers.push((req: any, log: any) => {
      log.meta ??= {}
      log.meta.query = req.query
      log.meta.params = req.params
    })
  }
  if (logContent.includes(LogContent.USER)) {
    serializers.push((req: any, log: any) => {
      const user = extractUser(req)
      log.user = {
        jwt: user,
        name: user?.sub ?? '/',
        roles: user?.roles.join(', ') ?? '/',
      }
    })
  }
  if (logContent.includes(LogContent.HEADERS)) {
    serializers.push((req: any, log: any) => {
      log.headers = req.headers
    })
  }
  if (logContent.includes(LogContent.REQ_BODY)) {
    serializers.push((req: any, log: any) => {
      log.body = req.body
    })
  }

  return (req: any) => {
    const log = {}
    for (const serializer of serializers) {
      serializer(req, log)
    }

    return log
  }
}

function responseSerializer(logContent: LogContent[]) {
  if (logContent.includes(LogContent.RES_BODY)) {
    return (res: any) => {
      return {
        statusCode: res.statusCode,
        body: res.responseBody,
      }
    }
  } else {
    return (res: any) => {
      return {
        statusCode: res.statusCode,
      }
    }
  }
}

export type ZarjaLoggerConfig = {
  transport: {
    env: string
    level: LogLevel
    content: LogContent[]
    format: LogFormat
  }
  cfg?: Omit<Params, 'pinoHttp'>
}

export function createLoggerConfig(
  {
    transport: {
      level = LogLevel.INFO,
      content = [LogContent.META, LogContent.USER],
      format = LogFormat.RAW,
      env = 'production',
    },
    cfg,
  }: ZarjaLoggerConfig = {
    transport: {
      level: LogLevel.INFO,
      content: [LogContent.META, LogContent.USER],
      format: LogFormat.RAW,
      env: 'production',
    },
  },
): LoggerModuleAsyncParams {
  return {
    useFactory: (): Params => {
      return {
        pinoHttp: {
          mixin(_context, level) {
            let label
            switch (level) {
              case 10:
                label = 'trace'
                break
              case 20:
                label = 'debug'
                break
              case 30:
                label = 'info'
                break
              case 40:
                label = 'warn'
                break
              case 50:
                label = 'error'
                break
            }
            return { 'level-label': label }
          },
          transport: initTransport(env, level, format, content),
          customLogLevel: (req, res) => {
            if (res.statusCode > 500) {
              return 'error'
            } else {
              return 'info'
            }
          },
          customSuccessMessage: (req, res) => {
            if (400 <= res.statusCode && res.statusCode < 500 && 'responseBody' in res) {
              return JSON.stringify(res.responseBody)
            } else {
              return 'request success'
            }
          },
          wrapSerializers: false,
          level: level,
          serializers: {
            req: requestSerializer(content),
            res: responseSerializer(content),
          },
        },
        ...cfg,
      }
    },
  }
}
