import { BaseVarOpts, ParseError, Value, Var } from './parsers'
import { BaseVar, TransformationContext } from './parsers/base'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'
export { Var } from './parsers'

export type ConfigDefinition<V extends BaseVarOpts, T extends Value | Value[] | undefined> = {
  [key: string]: ConfigDefinition<V, T> | BaseVar<V, T>
}

export type ExtractConfig<C extends ConfigDefinition<any, any>> = {
  [key in keyof C]: C[key] extends BaseVar<any, any>
    ? C[key]['output']
    : C[key] extends ConfigDefinition<any, any>
    ? ExtractConfig<C[key]>
    : never
}

export type Config<C extends ConfigDefinition<any, any>> = ExtractConfig<C> & {
  env: C['env'] extends BaseVar<any, any>
    ? C['env']['output']
    : 'local' | 'test' | 'staging' | 'production'
}

type InitOpts = {
  env?: Record<string, string | undefined>
  file?: string
  directory?: string
  fromFile?: boolean
}

type ParsedResult = { [key: string]: Value | Value[] | undefined | ParsedResult }
type ParsedNode =
  | {
      result: ParsedResult
    }
  | {
      errors: ParseError[]
    }

function parseEnvironment<T extends ConfigDefinition<BaseVarOpts, Value | Value[]>>(
  template: T,
  env: Record<string, string | undefined>,
  path = '',
): ParsedNode {
  const errors: ParseError[] = []

  const result = Object.entries(template).reduce((acc, [key, value]) => {
    const newPath = path ? path + '.' + key : key
    const name = path ? (path + '_' + key).toUpperCase() : key.toUpperCase()
    if (value instanceof BaseVar) {
      const res = value.parse(env, { path: newPath, name })
      if (typeof res === 'object' && !Array.isArray(res)) {
        errors.push(res)
      } else {
        acc[key] = res
      }
    } else {
      const res = parseEnvironment(value, env, newPath)
      if ('errors' in res) {
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

function runTransformations(
  config: any,
  template: ConfigDefinition<any, any>,
  env: string,
  path = '',
): ParsedNode {
  const errors: ParseError[] = []

  const result = Object.entries(template).reduce((acc, [key, value]) => {
    const newPath = path ? path + '.' + key : key
    const name = path ? (path + '_' + key).toUpperCase() : key.toUpperCase()
    if (value instanceof BaseVar) {
      const res = value.runTransformations(
        config[key],
        new TransformationContext({ env, path: newPath, name }),
      )
      if (typeof res === 'object' && !Array.isArray(res)) {
        errors.push(res)
      } else {
        acc[key] = res
      }
    } else {
      const res = runTransformations(config[key], value, env, newPath)
      if ('errors' in res) {
        errors.push(...res.errors)
      } else {
        acc[key] = res.result
      }
    }
    return acc
  }, config)

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
  { env, file = '.env.local', directory = './', fromFile = true }: InitOpts = {},
): Config<T> {
  if (!env && !fromFile) {
    env = process.env
  }

  if (!env) {
    const filePath = path.resolve(path.join(directory, file))
    const content = fs.readFileSync(filePath)
    env = dotenv.parse(content)
  }

  // @ts-expect-error
  template.env ??= Var.enum(['local', 'test', 'staging', 'production'])
    .name('NODE_ENV')
    .default('local')
  const res = parseEnvironment(template, env)

  if ('errors' in res) throw new EnvironmentInitializationFailed(res.errors)

  const result = runTransformations(res.result, template, (res.result as any).env)

  if ('errors' in result) throw new EnvironmentInitializationFailed(result.errors)

  return result.result as any
}
