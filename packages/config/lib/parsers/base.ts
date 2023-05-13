import { BaseVarOpts, ParseError, ParseParams } from './index'

type TransformParams = ParseParams & { env: string }

export class TransformationContext {
  constructor(public info: TransformParams) {}

  error(str: string): ParseError {
    return {
      error: str,
    }
  }
}

type Transformer<T, R> = (arg: T, ctx: TransformationContext) => R

export abstract class BaseVar<In extends BaseVarOpts, Output> {
  _output: Output
  private _optional = false
  private _default?: Output | undefined = undefined
  private _name?: string | undefined = undefined
  private _transformers: Transformer<any, any>[] = []

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

  private getName(name: string): string {
    return this._name ?? name
  }

  protected abstract _parse(value: string, params: ParseParams): Output | ParseError

  transform(envs: string[], transformer: Transformer<Output, Output>): BaseVar<In, Output>
  transform<R = Output>(transformer: Transformer<Output, R>): BaseVar<In, R>
  transform<R = Output>(
    envsOrtransformer: Transformer<Output, Output> | string[],
    transformer?: Transformer<Output, R>,
  ): BaseVar<In, R> {
    if (Array.isArray(envsOrtransformer)) {
      if (transformer != null) {
        this._transformers.push((arg, ctx) => {
          if (envsOrtransformer.includes(ctx.info.env)) {
            return transformer(arg, ctx)
          }

          return arg
        })
      } else {
        throw new Error(
          'You have to provide a transformation function if you are limiting environments',
        )
      }
    } else {
      this._transformers.push(envsOrtransformer)
    }

    return this as any
  }

  private parse(environment: Record<string, unknown>, params: ParseParams): Output | ParseError {
    const name = this._name ?? params.name
    params.name = name
    let value = environment[name]

    if (this._default != null && value == null) {
      value = String(this._default)
    } else if (!this._optional && value == null) {
      return {
        error: `Value of '${params.path}' (${name}) should be a${
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

  private _runTransformations(value: In['type'], ctx: TransformationContext): Output | ParseError {
    return this._transformers.reduce((res: In['type'] | ParseError, transformer) => {
      if (typeof res === 'object' && 'errors' in res) {
        return res
      } else {
        return transformer(res, ctx)
      }
    }, value as any)
  }
}
