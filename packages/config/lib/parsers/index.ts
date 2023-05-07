import { StringVar } from './string'
import { NumberVar } from './number'
import { BooleanVar } from './boolean'
import { ArrayVar } from './array'
import { EnumVar } from './enum'

export type Value = string | number | boolean
export type ValueStr = 'string' | 'number' | 'boolean'
export type ExtractValue<T extends ValueStr> = T extends 'string'
  ? string
  : T extends 'number'
  ? number
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

  static array<T extends ValueStr>(contains: T) {
    return new ArrayVar({ type: 'array', contains })
  }

  static enum<T extends { [key: string]: string } | readonly string[]>(output: T): EnumVar<T> {
    return new EnumVar({ type: 'enum', enum: output })
  }
}
