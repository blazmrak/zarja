import { INestApplication, ValidationPipe } from '@nestjs/common'
import { ClassSerializerInterceptor, ExcludeNullInterceptor, PaginationDto } from './serialization'
import { Reflector } from '@nestjs/core'
import helmet, { HelmetOptions } from 'helmet'
import { AuthGuard } from './auth'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

export * from './pagination'
export * from './validation'
export * from './serialization'

type PackerHttpOpts = {
  helmet: HelmetOptions
  serialization: {
    serializeResponses: boolean
    excludeNullFromResponse: boolean
  }
  jwt?: {
    enabled: boolean
    secret: string
  }
  swagger?: {
    enabled: boolean
    version: string
    title: string
    document?: {
      jsonPath?: string
      yamlPath?: string
    }
    gui: {
      path: string
    }
  }
}

export class ZarjaHttp {
  static setup(app: INestApplication, opts: PackerHttpOpts) {
    app.use(helmet(opts.helmet))

    if (opts.jwt?.enabled) app.useGlobalGuards(new AuthGuard(opts.jwt))

    app.useGlobalPipes(new ValidationPipe({ whitelist: true }))

    if (opts.serialization.serializeResponses)
      app.useGlobalInterceptors(new ClassSerializerInterceptor(new Reflector()))

    if (opts.serialization.excludeNullFromResponse)
      app.useGlobalInterceptors(new ExcludeNullInterceptor())

    if (opts.swagger?.enabled) {
      const config = new DocumentBuilder()
        .setTitle(opts.swagger.title)
        .setVersion(opts.swagger.version)
        .addBearerAuth()
        .build()

      const document = SwaggerModule.createDocument(app, config, { extraModels: [PaginationDto] })
      SwaggerModule.setup(opts.swagger.gui.path, app, document, {
        jsonDocumentUrl: opts.swagger.document?.jsonPath,
        yamlDocumentUrl: opts.swagger.document?.yamlPath,
        swaggerOptions: <any>{
          docExpansion: 'list',
          filter: true,
          showExtensions: true,
          showCommonExtensions: true,
          defaultModelExpandDepth: 100,
          defaultModelsExpandDepth: 100,
        },
      })
    }
  }
}
