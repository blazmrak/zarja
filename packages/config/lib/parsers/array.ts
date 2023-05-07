import { NumberVar } from './number'
import { StringVar } from './string'
import { BooleanVar } from './boolean'
import { BaseVarOpts, ExtractValue, ParseParams, ValueType } from './index'
import { BaseVar } from './base'
import { EnumVar } from './enum'

type ArrayVarOpts<T extends ValueType> = {
  type: 'array'
  contains: T
}
export class ArrayVar<
  Contains extends ValueType,
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
      default:
        this._parser = new EnumVar({ type: 'enum', enum: params.contains })
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
