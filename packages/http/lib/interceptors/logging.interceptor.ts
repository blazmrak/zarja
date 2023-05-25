import {
  ArgumentsHost,
  BadRequestException,
  CallHandler,
  Catch,
  ExceptionFilter,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common'
import { Observable, tap } from 'rxjs'
import { Response } from 'express'

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      tap(data => {
        const response = context.switchToHttp().getResponse()

        response.responseBody = data
      }),
    )
  }
}

@Catch(HttpException)
export class ExceptionLoggingFilter implements ExceptionFilter {
  catch(e: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = e.getResponse()
    ctx.getResponse()['responseBody'] = response

    ctx.getResponse<Response>().status(e.getStatus()).json(response)
  }
}
