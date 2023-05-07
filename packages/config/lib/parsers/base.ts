import { BaseVarOpts, ParseError, ParseParams } from './index'

export class TransformationContext {
  info: ParseParams
  error(str: string): ParseError {
    return {
      error: str,
    }
  }
}

export abstract class BaseVar<In extends BaseVarOpts, Output> {
  output: Output
  protected _optional = false
  protected _default?: Output | undefined = undefined
  protected _name?: string | undefined = undefined
  protected _transformer: Function

  constructor(protected _opts: In) {}

  optional(): BaseVar<In, Output | undefined> {
    this._optional = true
    this._default = undefined
    return this
  }

  default(value: Output): BaseVar<In, Exclude<Output, undefined>> {
    this._optional = false
    this._default = value
    return this as unknown as BaseVar<In, Exclude<Output, undefined>>
  }

  name(name: string): BaseVar<In, Output> {
    this._name = name
    return this
  }

  protected abstract _parse(value: string, params: ParseParams): Output | ParseError

  parse(environment: Record<string, unknown>, params: ParseParams): Output | ParseError {
    const name = this._name ?? params.name
    let value = environment[name]
    if (this._default != null && value == null) {
      value = String(this._default)
    } else if (!this._optional && value == null) {
      return {
        error: `Value of '${params.path}' (${params.name}) should be a${
          ['a', 'e'].includes(this._opts.type.charAt(0)) ? 'n' : ''
        } ${this._opts.type}`,
      }
    } else if (this._optional && value == null) {
      return undefined as any
    }

    if (typeof value !== 'string') {
      throw new Error('Bad environment')
    }

    return this._parse(value, params)
  }

  transform<R = Output>(
    transformer: (arg: Output, ctx: TransformationContext) => R,
  ): BaseVar<In, R> {
    this._transformer = transformer
    return this as any
  }
}
