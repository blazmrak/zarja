import { ParseError } from './index'
import { BaseVar } from './base'

type BooleanVarOpts = {
  type: 'boolean'
}
export class BooleanVar extends BaseVar<BooleanVarOpts, boolean> {
  constructor() {
    super({ type: 'boolean' })
  }

  _parse(value: string): boolean | ParseError {
    return value === 'true'
  }
}
