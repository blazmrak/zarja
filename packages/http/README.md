# Usage

```ts
// modules/app.module.ts
import { createLoggerConfig, ZarjaHttp } from '@zarja/http'
import { NestFactory, Module } from '@nestjs/common'
import { LoggerModule } from 'nestjs-pino'
import { config } from '../common/config' // Environment configuration

async function createApp() {
  const app = NestFactory.create(AppModule, { bufferLogs: true })

  ZarjaHttp.setup(app, {
    serialization: {
      serializeResponses: true,
      excludeNullFromResponse: true
    },
    logger: config.logger
  })

  return app
}

@Module({
  import: [
    LoggerModule.forRootAsync(createLoggerConfig(config.logger)),
    // ...
  ]
})
export class AppModule {}
```

```ts
// main.ts
import { createApp } from './modules/app.module'

createApp().then(app => app.start())
```