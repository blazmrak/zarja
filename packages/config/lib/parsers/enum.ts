import { ParseParams } from './index'
import { BaseVar } from './base'

type EnumVarOpts<T> = {
  type: 'enum'
  enum: T
}
export type EnumOutput<T> = T extends {
  [key: string]: string
}
  ? T[keyof T]
  : T extends readonly string[]
  ? T[number]
  : never

export type Enum = { [key: string]: string } | readonly string[]

export class EnumVar<T extends Enum> extends BaseVar<EnumVarOpts<T>, EnumOutput<T>> {
  _parse(value: string, params: ParseParams) {
    let valid: string[] = []
    if (Array.isArray(this._opts.enum)) {
      valid = this._opts.enum
    } else {
      valid = Object.values(this._opts.enum)
    }

    return valid.includes(value)
      ? (value as any)
      : {
          error: `Value of '${params.path}' (${params.name}) should be one of [${valid.join(
            ', ',
          )}]`,
        }
  }
}
