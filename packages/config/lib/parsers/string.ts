import { ParseError, ParseParams } from './index'
import { BaseVar } from './base'

type StringVarOpts = {
  type: 'string'
}
export class StringVar extends BaseVar<StringVarOpts, string> {
  constructor() {
    super({ type: 'string' })
  }

  protected _parse(value: string, { path }: ParseParams): string | ParseError {
    return value as any
  }
}
