import { StringVar } from './string'
import { NumberVar } from './number'
import { BooleanVar } from './boolean'
import { ArrayVar } from './array'
import { Enum, EnumOutput, EnumVar } from './enum'

export type Value = string | number | boolean
export type ValueType = 'string' | 'number' | 'boolean' | Enum
export type ExtractValue<T extends ValueType> = T extends 'string'
  ? string
  : T extends 'number'
  ? number
  : T extends Enum
  ? EnumOutput<T>
  : boolean

export type ParseError = { error: string }
export type ParseParams = { path: string; name: string }

export type BaseVarOpts = {
  type: string
}

export class Var {
  static string() {
    return new StringVar()
  }

  static number() {
    return new NumberVar()
  }

  static boolean() {
    return new BooleanVar()
  }

  static array<T extends ValueType>(contains: T) {
    return new ArrayVar({ type: 'array', contains })
  }

  static enum<T extends Enum>(output: T): EnumVar<T> {
    return new EnumVar({ type: 'enum', enum: output })
  }
}
