import { ParseError, ParseParams } from './index'
import { BaseVar } from './base'

type NumberVarOpts = {
  type: 'number'
}
export class NumberVar extends BaseVar<NumberVarOpts, number> {
  constructor() {
    super({ type: 'number' })
  }

  protected _parse(value: string, params: ParseParams): number | ParseError {
    const num = parseInt(value, 10)

    if (isNaN(num)) {
      return { error: `Value of '${params.path}' (${params.name}) should be a number` }
    }

    return num
  }
}
