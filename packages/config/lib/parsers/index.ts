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
  static string(def?: string) {
    if (def != null) {
      return new StringVar().default(def)
    }

    return new StringVar()
  }

  static number(def?: number) {
    if (def != null) {
      return new NumberVar().default(def)
    }

    return new NumberVar()
  }

  static boolean(def?: boolean) {
    if (def != null) {
      return new BooleanVar().default(def)
    }

    return new BooleanVar()
  }

  static array<T extends ValueType>(contains: T) {
    return new ArrayVar({ type: 'array', contains })
  }

  static enum<T extends Enum | string>(output: T): EnumVar<T extends Enum ? T : never> {
    if (typeof output === 'string') {
      return new EnumVar({ type: 'enum', enum: [output] }).default(output) as any
    }

    return new EnumVar({ type: 'enum', enum: output }) as any
  }
}
