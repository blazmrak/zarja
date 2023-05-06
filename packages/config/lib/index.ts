import * as stream from 'stream'

type Value = string | number | boolean
type ValueStr = 'string' | 'number' | 'boolean'
type ExtractValue<T extends ValueStr> = T extends 'string'
  ? string
  : T extends 'number'
  ? number
  : boolean

type ParseError = { error: string }
type ParseParams = { path: string; name: string }

type BaseVarOpts = {
  type: string
}

abstract class BaseVar<In extends BaseVarOpts, Output> {
  output: Output
  protected _optional = false
  protected _default?: Output | undefined = undefined
  protected _name?: string | undefined = undefined

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
}

type StringVarOpts = {
  type: 'string'
}
class StringVar extends BaseVar<StringVarOpts, string> {
  constructor() {
    super({ type: 'string' })
  }

  _parse(value: string, { path }: ParseParams): string | ParseError {
    return value as any
  }
}

type NumberVarOpts = {
  type: 'number'
}
class NumberVar extends BaseVar<NumberVarOpts, number> {
  constructor() {
    super({ type: 'number' })
  }

  _parse(value: string, params: ParseParams): number | ParseError {
    const num = parseInt(value, 10)

    if (isNaN(num)) {
      return { error: `Value of '${params.path}' (${params.name}) should be a number` }
    }

    return num
  }
}

type BooleanVarOpts = {
  type: 'boolean'
}
class BooleanVar extends BaseVar<BooleanVarOpts, boolean> {
  constructor() {
    super({ type: 'boolean' })
  }

  _parse(value: string): boolean | ParseError {
    return value === 'true'
  }
}

type ArrayVarOpts<T extends ValueStr> = {
  type: 'array'
  contains: T
}
class ArrayVar<Contains extends ValueStr, Input extends ArrayVarOpts<Contains>> extends BaseVar<
  Input,
  ExtractValue<Input['contains']>[]
> {
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

type EnumVarOpts<T> = {
  type: 'enum'
  enum: T
}
type EnumOutput<T> = T extends {
  [key: string]: string
}
  ? T[keyof T]
  : T extends readonly string[]
  ? T[number]
  : never

class EnumVar<T extends { [key: string]: string } | readonly string[]> extends BaseVar<
  EnumVarOpts<T>,
  EnumOutput<T>
> {
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

export type ConfigDefinition<V extends BaseVarOpts, T extends Value | Value[] | undefined> = {
  [key: string]: ConfigDefinition<V, T> | BaseVar<V, T>
}

export type Config<C extends ConfigDefinition<any, any>> = {
  [key in keyof C]: C[key] extends BaseVar<any, any>
    ? C[key]['output']
    : C[key] extends ConfigDefinition<any, any>
    ? Config<C[key]>
    : never
}

type InitOpts = {
  env?: Record<string, string | undefined>
  path?: string
}

type ParsedResult = { [key: string]: Value | Value[] | undefined | ParsedResult }
type ParsedNode = {
  result?: ParsedResult
  errors?: ParseError[]
}

function parseEnvironment<T extends ConfigDefinition<BaseVarOpts, Value | Value[]>>(
  template: T,
  env: Record<string, string | undefined>,
  path: string,
): ParsedNode {
  const errors: ParseError[] = []

  const result = Object.entries(template).reduce((acc, [key, value]) => {
    const newPath = path ? path + '.' + key : key
    const name = path ? path + '_' + key.toUpperCase() : key.toUpperCase()
    if (value instanceof BaseVar) {
      const res = value.parse(env, { path: newPath, name: name })
      if (typeof res === 'object' && !Array.isArray(res)) {
        errors.push(res)
      } else {
        acc[key] = res
      }
    } else {
      const res = parseEnvironment(value, env, newPath)
      if (res.errors) {
        errors.push(...res.errors)
      } else {
        acc[key] = res.result
      }
    }
    return acc
  }, {} as ParsedResult)

  if (errors.length > 0) {
    return { errors }
  } else {
    return { result }
  }
}

class EnvironmentInitializationFailed {
  constructor(public errors: ParseError[]) {}
}

export function initializeEnvironment<T extends ConfigDefinition<any, any>>(
  template: T,
  { env = process.env, path = '' }: InitOpts = {},
): Config<T> {
  const { result, errors } = parseEnvironment(template, env, path)

  if (errors) throw new EnvironmentInitializationFailed(errors)

  return result as any
}
