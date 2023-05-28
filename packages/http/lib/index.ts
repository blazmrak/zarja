import { DynamicModule, INestApplication, ValidationPipe } from '@nestjs/common'
import { ClassSerializerInterceptor, ListDto, PaginationDto } from './api/serialization'
import { Reflector } from '@nestjs/core'
import helmet, { HelmetOptions } from 'helmet'
import { AuthGuard } from './api/auth'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { ExceptionLoggingFilter, LoggerInterceptor } from './interceptors/logging.interceptor'
import { Logger, LoggerModule } from 'nestjs-pino'
import { ClassConstructor } from 'class-transformer'
import { ExcludeNullInterceptor } from './interceptors/exclude-null.interceptor'
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface'
import { createLoggerConfig, ZarjaLoggerConfig } from './logger'

export * from './logger'
export * from './api/pagination'
export * from './api/validation'
export * from './api/serialization'

export enum LogContent {
  META = 'meta',
  PARAMS = 'params',
  USER = 'user',
  HEADERS = 'headers',
  REQ_BODY = 'req-body',
  RES_BODY = 'res-body',
}

export type ZarjaHttpOpts = {
  helmet?: HelmetOptions
  cors?: CorsOptions
  serialization?: {
    serializeResponses: boolean
    excludeNullFromResponse: boolean
  }
  jwt?: {
    secret: string
  }
  logger?: {
    content: LogContent[]
  }
  swagger?: {
    version: string
    title: string
    document?: {
      jsonPath?: string
      yamlPath?: string
    }
    gui?: {
      path: string
    }
    extraModels?: ClassConstructor<any>[]
  }
}

export type ZarjaHttpModuleConfig = {
  logger?: ZarjaLoggerConfig
}

export class ZarjaHttp {
  static forRootAsync(config: ZarjaHttpModuleConfig): DynamicModule {
    return {
      module: ZarjaHttp,
      imports: [LoggerModule.forRootAsync(createLoggerConfig(config.logger))],
    }
  }

  static setup(app: INestApplication, opts: ZarjaHttpOpts) {
    app.use(helmet(opts.helmet))
    app.enableCors(opts.cors)

    if (opts.jwt) app.useGlobalGuards(new AuthGuard(opts.jwt))

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    )

    // Register logger interceptor first, as it will run last this way
    if (opts.logger?.content.includes(LogContent.RES_BODY)) {
      app.useGlobalInterceptors(new LoggerInterceptor())
      app.useGlobalFilters(new ExceptionLoggingFilter())
    }

    if (opts.serialization?.excludeNullFromResponse)
      app.useGlobalInterceptors(new ExcludeNullInterceptor())

    if (opts.serialization?.serializeResponses)
      app.useGlobalInterceptors(
        new ClassSerializerInterceptor(new Reflector(), {
          enableImplicitConversion: true,
          excludeExtraneousValues: true,
        }),
      )

    app.useLogger(app.get(Logger))
    app.flushLogs()

    if (opts.swagger) {
      const config = new DocumentBuilder()
        .setTitle(opts.swagger.title)
        .setVersion(opts.swagger.version)
        .addBearerAuth()
        .build()

      const extraModels = opts.swagger.extraModels ?? []
      extraModels.push(PaginationDto, ListDto)

      const document = SwaggerModule.createDocument(app, config, {
        extraModels,
      })

      SwaggerModule.setup(opts.swagger.gui?.path ?? '/q/openapi', app, document, {
        jsonDocumentUrl: opts.swagger.document?.jsonPath,
        yamlDocumentUrl: opts.swagger.document?.yamlPath,
        swaggerOptions: <any>{
          docExpansion: 'list',
          filter: true,
          showExtensions: true,
          showCommonExtensions: true,
          defaultModelExpandDepth: 100,
          defaultModelsExpandDepth: 100,
          tagsSorter: 'alpha',
        },
      })
    }
  }
}
