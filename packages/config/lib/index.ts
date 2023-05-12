import { BaseVarOpts, ParseError, Value, Var } from './parsers'
import { BaseVar, TransformationContext } from './parsers/base'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'
export { Var } from './parsers'

export type ConfigDefinitionRec<V extends BaseVarOpts, T extends Value | Value[] | undefined> = {
  [key: string]: ConfigDefinitionRec<V, T> | BaseVar<V, T>
}

export type ConfigDefinition<
  V extends BaseVarOpts,
  T extends Value | Value[] | undefined,
> = ConfigDefinitionRec<V, T> & { env?: BaseVar<V, T> }

export type ExtractConfig<C extends ConfigDefinition<any, any>> = {
  [key in keyof C]: C[key] extends BaseVar<any, any>
    ? C[key]['output']
    : C[key] extends ConfigDefinitionRec<any, any>
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

function parseEnvironment<T extends ConfigDefinitionRec<BaseVarOpts, Value | Value[]>>(
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
  template: ConfigDefinitionRec<any, any>,
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

type Variable = { name: string; path: string; type: string; required: boolean; default: any }

function extractVariables(
  template: ConfigDefinitionRec<any, any>,
  env: string,
  path = '',
): Variable[] {
  return Object.entries(template).reduce((acc, [key, value]) => {
    const newPath = path ? path + '.' + key : key
    const name = path ? (path + '_' + key).toUpperCase() : key.toUpperCase()
    if (value instanceof BaseVar) {
      const actualName = value.getName(name)
      let required = !value['_optional'] && value['_default'] === undefined
      let def = required
        ? undefined
        : value.runTransformations(
            value['_default'],
            new TransformationContext({ env, path: newPath, name: name }),
          )
      acc.push({
        name: actualName,
        path: newPath,
        type: value['_opts']['type'],
        required,
        default: def,
      })
    } else {
      const res = extractVariables(value, env, newPath)
      acc.push(...res)
    }
    return acc
  }, [] as Variable[])
}

class EnvironmentInitializationFailed {
  constructor(public errors: ParseError[]) {}
}

export function getVariables<T extends ConfigDefinition<any, any>>(
  template: T,
  environment?: string,
): Variable[] {
  if (environment) {
    template.env = Var.enum(environment).name(template.env?.getName('ENV') ?? 'NODE_ENV')
  }

  template.env ??= Var.enum(['local', 'test', 'staging', 'production'])
    .name('NODE_ENV')
    .default('local')
  let env = template.env['_default']
  env = template.env.runTransformations(
    env,
    new TransformationContext({ env, path: 'env', name: template.env.getName('ENV') }),
  )

  return extractVariables(template, env)
}

export function renderEnvFileContent(variables: Variable[]) {
  return variables
    .map(v => {
      if (!v.required && v.default == null) {
        return `#${v.name}=`
      } else if (v.default != null) {
        return `#${v.name}=${v.default}`
      } else {
        return `${v.name}=`
      }
    })
    .join('\n')
}

function readFile(directory: string, file: string) {
  const filePath = path.resolve(path.join(directory, file))
  let content
  try {
    content = fs.readFileSync(filePath)
  } catch {
    console.warn(`error reading .env file at ${filePath}, defaulting to process.env`)
    return process.env
  }

  try {
    return dotenv.parse(content)
  } catch {
    console.warn(`failed to parse '${file}', defaulting to process.env`)
    return process.env
  }
}

export function initializeEnvironment<T extends ConfigDefinition<any, any>>(
  template: T,
  { env, file = '.env.local', directory = './', fromFile = true }: InitOpts = {},
): Config<T> {
  if (!env && !fromFile) {
    env = process.env
  } else if (!env) {
    env = readFile(directory, file)
  }

  template.env ??= Var.enum(['local', 'test', 'staging', 'production'])
    .name('NODE_ENV')
    .default('local')
  const res = parseEnvironment(template, env)

  if ('errors' in res) throw new EnvironmentInitializationFailed(res.errors)

  const result = runTransformations(res.result, template, (res.result as any).env)

  if ('errors' in result) throw new EnvironmentInitializationFailed(result.errors)

  return result.result as any
}
