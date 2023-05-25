import { applyDecorators } from '@nestjs/common'
import {
  IsEnum as CVIsEnum,
  IsNumber as CVIsNumber,
  IsNumberOptions,
  IsOptional as CVIsOptional,
  IsString,
  Max as CVMax,
  MaxLength as CVMaxLength,
  Min as CVMin,
  MinLength as CVMinLength,
  ValidationOptions,
} from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export const IsNumber = (numOpts?: IsNumberOptions, validOpts?: ValidationOptions) =>
  applyDecorators(
    CVIsNumber(numOpts, validOpts),
    ApiProperty({ isArray: validOpts?.each, type: 'number' }),
  )

export const Max = (maximum: number) =>
  applyDecorators(CVIsNumber(), CVMax(maximum), ApiProperty({ maximum }))

export const Min = (minimum: number) =>
  applyDecorators(CVIsNumber(), CVMin(minimum), ApiProperty({ minimum }))

export const MaxLength = (maxLength: number) =>
  applyDecorators(IsString(), CVMaxLength(maxLength), ApiProperty({ maxLength }))

export const MinLength = (minLength: number) =>
  applyDecorators(IsString(), CVMinLength(minLength), ApiProperty({ minLength }))

export const IsEnum = (value: object, opts?: ValidationOptions) =>
  applyDecorators(CVIsEnum(value, opts), ApiProperty({ enum: value, isArray: opts?.each }))

export const IsOptional = () => applyDecorators(CVIsOptional(), ApiProperty({ required: false }))
