import { BaseVarOpts, ParseError, Value } from './parsers'
import { BaseVar } from './parsers/base'
import * as dotenv from 'dotenv'
import * as path from 'path'
export { Var } from './parsers'

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
  file?: string
  directory?: string
}

type ParsedResult = { [key: string]: Value | Value[] | undefined | ParsedResult }
type ParsedNode = {
  result?: ParsedResult
  errors?: ParseError[]
}

function parseEnvironment<T extends ConfigDefinition<BaseVarOpts, Value | Value[]>>(
  template: T,
  env: Record<string, string | undefined>,
  path = '',
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
  { env, file = '.env.local', directory = './' }: InitOpts = {},
): Config<T> {
  if (!env) {
    const filePath = path.resolve(path.join(directory, file))
    dotenv.config({ path: filePath })
    env = process.env
  }

  const { result, errors } = parseEnvironment(template, env)

  if (errors) throw new EnvironmentInitializationFailed(errors)

  return result as any
}
