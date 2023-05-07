import { NumberVar } from './number'
import { StringVar } from './string'
import { BooleanVar } from './boolean'
import { BaseVarOpts, ExtractValue, ParseParams, ValueStr } from './index'
import { BaseVar } from './base'

type ArrayVarOpts<T extends ValueStr> = {
  type: 'array'
  contains: T
}
export class ArrayVar<
  Contains extends ValueStr,
  Input extends ArrayVarOpts<Contains>,
> extends BaseVar<Input, ExtractValue<Input['contains']>[]> {
  private readonly _parser: BaseVar<BaseVarOpts, any>
  constructor(params: Input) {
    super(params)

    switch (params.contains) {
      case 'number':
        this._parser = new NumberVar()
        break
      case 'string':
        this._parser = new StringVar()
        break
      case 'boolean':
        this._parser = new BooleanVar()
        break
    }
  }

  _parse(value: string, params: ParseParams) {
    return value
      .split(',')
      .map(v => v.trim())
      .filter(v => v)
      .map(v => this._parser['_parse'](v, params))
  }
}
