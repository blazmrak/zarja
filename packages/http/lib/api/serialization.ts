import {
  applyDecorators,
  CallHandler,
  ClassSerializerInterceptorOptions,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  NestInterceptor,
  PlainLiteralObject,
  SetMetadata,
  StreamableFile,
} from '@nestjs/common'
import * as classTransformer from 'class-transformer'
import { ClassConstructor, Exclude, Expose, Type } from 'class-transformer'
import { ApiOkResponse, ApiProperty, getSchemaPath } from '@nestjs/swagger'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { ClassTransformOptions } from '@nestjs/common/interfaces/external/class-transform-options.interface'
import { IsNumber } from 'class-validator'
import { Pagination } from './pagination'

type PublicOpts = {
  isArray?: boolean
}
export const Public = (opts?: PublicOpts) =>
  applyDecorators(Expose(), ApiProperty({ isArray: opts?.isArray }))

export const ListType = (type: ClassConstructor<any>) =>
  applyDecorators(
    Type(() => type),
    ApiProperty({ isArray: true, type }),
  )

export const Serialize = (type?: ClassConstructor<any> | unknown) =>
  applyDecorators(SetMetadata(ClassSerializerInterceptor.METADATA_OPTIONS, { type }))

export const ApiResult = <T extends ClassConstructor<any>>(type: T) =>
  applyDecorators(
    Serialize(type),
    ApiOkResponse({
      type,
    }),
  )

export const ApiListResult = <T extends ClassConstructor<any>>(model: T) =>
  applyDecorators(
    Serialize(new ListDto(model)),
    ApiOkResponse({
      schema: {
        title: `ListResponseOf${model.name}`,
        allOf: [
          { $ref: getSchemaPath(ListDto) },
          {
            properties: {
              data: {
                type: 'array',
                items: { $ref: getSchemaPath(model) },
              },
            },
          },
        ],
      },
    }),
  )

export const ApiPaginatedResult = <T extends ClassConstructor<any>>(model: T) =>
  applyDecorators(
    Serialize(new PaginationDto(model)),
    ApiOkResponse({
      schema: {
        title: `PaginatedResponseOf${model.name}`,
        allOf: [
          { $ref: getSchemaPath(PaginationDto) },
          {
            properties: {
              data: {
                type: 'array',
                items: { $ref: getSchemaPath(model) },
              },
            },
          },
        ],
      },
    }),
  )

export class PaginationDto<T> implements Pagination<T> {
  @Exclude()
  private _type: T

  @Public()
  @Type((opts: any) => opts.newObject._type)
  data: T[]

  @Public()
  @IsNumber()
  page: number

  @Public()
  @IsNumber()
  perPage: number

  @Public()
  @IsNumber()
  count: number

  @Public()
  @IsNumber()
  maxPage: number

  constructor(type: T) {
    this._type = type
  }
}

export class ListDto<T> implements Pick<Pagination<T>, 'data'> {
  @Exclude()
  private _type: T

  @Type((opts: any) => opts.newObject._type)
  @Public()
  data: T[]

  constructor(type: T) {
    this._type = type
  }
}

interface SerializationOpts extends ClassTransformOptions {
  type?: ClassConstructor<any> | unknown
}

@Injectable()
export class ClassSerializerInterceptor implements NestInterceptor {
  static METADATA_OPTIONS = 'kaldi-serializer/options'

  constructor(
    protected readonly reflector: any,
    protected readonly defaultOptions: ClassSerializerInterceptorOptions = {},
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const contextOptions = this.getContextOptions(context)
    const options = {
      ...this.defaultOptions,
      ...contextOptions,
    }
    return next
      .handle()
      .pipe(
        map((res: PlainLiteralObject | Array<PlainLiteralObject>) => this.serialize(res, options)),
      )
  }

  /**
   * Serializes responses that are non-null objects nor streamable files.
   */
  serialize(
    response: PlainLiteralObject | Array<PlainLiteralObject>,
    options: SerializationOpts,
  ): PlainLiteralObject | Array<PlainLiteralObject> {
    if (response == null || typeof response !== 'object' || response instanceof StreamableFile) {
      return response
    }

    return Array.isArray(response)
      ? response.map(item => this.transformToPlain(item, options))
      : this.transformToPlain(response, options)
  }

  transformToPlain(plainOrClass: any, options: SerializationOpts): PlainLiteralObject {
    if (!plainOrClass) {
      return plainOrClass
    }
    if (!options.type) {
      return classTransformer.instanceToPlain(plainOrClass, options)
    }
    if (options.type instanceof Function && plainOrClass instanceof options.type) {
      return classTransformer.instanceToPlain(plainOrClass, options)
    }

    let instance
    if (options.type instanceof Function) {
      instance = classTransformer.plainToInstance(
        options.type as ClassConstructor<any>,
        plainOrClass,
      )
    } else if (typeof options.type === 'object') {
      instance = classTransformer.plainToClassFromExist(options.type, plainOrClass)
    } else {
      throw new InternalServerErrorException()
    }

    return classTransformer.instanceToPlain(instance, options)
  }

  protected getContextOptions(context: ExecutionContext): SerializationOpts | undefined {
    return this.reflector.getAllAndOverride(ClassSerializerInterceptor.METADATA_OPTIONS, [
      context.getHandler(),
      context.getClass(),
    ])
  }
}
