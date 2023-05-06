import { applyDecorators } from '@nestjs/common'
import {
  IsEnum as CVIsEnum,
  IsNumber,
  IsOptional as CVIsOptional,
  IsString,
  Max as CVMax,
  MaxLength as CVMaxLength,
  Min as CVMin,
  MinLength as CVMinLength,
  ValidationOptions,
} from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { Transform } from 'class-transformer'

export const Max = (maximum: number) =>
  applyDecorators(IsNumber(), CVMax(maximum), ApiProperty({ maximum }))

export const Min = (minimum: number) =>
  applyDecorators(IsNumber(), CVMin(minimum), ApiProperty({ minimum }))

export const MaxLength = (maxLength: number) =>
  applyDecorators(IsString(), CVMaxLength(maxLength), ApiProperty({ maxLength }))

export const MinLength = (minLength: number) =>
  applyDecorators(IsString(), CVMinLength(minLength), ApiProperty({ minLength }))

export const IsEnum = (value: object, opts?: ValidationOptions) =>
  applyDecorators(CVIsEnum(value, opts), ApiProperty({ enum: value, isArray: opts?.each }))

export const IsOptional = () => applyDecorators(CVIsOptional(), ApiProperty({ required: false }))

export const Default = (defaultValue: unknown) => {
  if (defaultValue instanceof Function) {
    return applyDecorators(
      Transform((value: unknown) => value ?? defaultValue()),
      ApiProperty({ default: defaultValue() }),
    )
  }

  return applyDecorators(
    Transform((value: unknown) => value ?? defaultValue),
    ApiProperty({ default: defaultValue }),
  )
}
