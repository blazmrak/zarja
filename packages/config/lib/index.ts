type Value = string | number | boolean
type ValueStr = 'string' | 'number' | 'boolean'
type ExtractValue<T extends ValueStr> = T extends 'string'
                                        ? string
                                        : T extends 'number'
                                          ? number
                                          : boolean

class Def<In extends ValueStr, Out extends Value | Value[] | undefined = ExtractValue<In>> {
  output: Out
  private _optional = false
  private _default: Out | undefined = undefined
  private _name: string | undefined = undefined

  constructor(private _type: In, private _isArray = false) {}

  static string() {
    return new Def('string')
  }

  static number() {
    return new Def('number')
  }

  static boolean() {
    return new Def('boolean')
  }

  static array<T extends ValueStr>(type: T): Def<T, ExtractValue<T>[]> {
    return new Def(type, true)
  }

  optional(): Def<In, Out | undefined> {
    this._optional = true
    this._default = undefined
    return this
  }

  default(value: Out): Def<In, Exclude<Out, undefined>> {
    this._optional = false
    this._default = value
    return this as unknown as Def<In, Exclude<Out, undefined>>
  }

  name(name: string): Def<In, Out> {
    this._name = name
    return this
  }

  parse(environment: Record<string, unknown>, path: string): Out | { error: string } {
    path = this._name ?? path
    const value = environment[this._name ?? path] ?? this._default

    if (value == null) {
      if (!this._optional) {
        return { error: `Variable ${path} is missing` }
      } else {
        this.output = undefined as Out
        return this.output
      }
    }

    if (this._isArray) {
      if (typeof value !== 'string') {
        return { error: `Variable ${path} must be a comma separated list of ${this._type}s` }
      }

      this.output = value
        .split(',')
        .map(s => s.trim())
        .filter(s => s)
        .map(s => {
          if (this._type === 'number') {
            return parseInt(s, 10)
          } else if (this._type === 'boolean') {
            return s === 'true'
          } else {
            return s
          }
        }) as Out
      return this.output
    }

    if (this._type === 'string') {
      this.output = value as Out
      return this.output
    } else if (this._type === 'boolean') {
      this.output = (value === 'true') as Out
      return this.output
    } else {
      if (typeof value !== 'string') {
        return { error: `Variable ${path} must be a number` }
      }

      try {
        const result = parseInt(value, 10)
        if (isNaN(result)) {
          return { error: `Variable ${path} must be a number` }
        }

        this.output = result as Out
        return this.output
      } catch {
        return { error: `Variable ${path} must be a number` }
      }
    }
  }
}

type Conf<V extends ValueStr, T extends Value | Value[] | undefined> = {
  [key: string]: Conf<V, T> | Def<V, T>
}

type TypeOfDef<T extends Def<any, any>> = T['output']

type ExtractModel<C extends Conf<any, any>> = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  [key in keyof C]: C[key] extends Def<any, any> ? TypeOfDef<C[key]> : ExtractModel<C[key]>
}

export function initializeEnvironment<T extends Conf<any, any>>(conf: T, path = '') {
  return Object.entries(conf).reduce((acc, [key, value]) => {
    const p = path ? path + '_' + key.toUpperCase() : key.toUpperCase()
    if (value instanceof Def) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      acc[key] = value.parse({ NEKI: 'neki', GNEZDEN_NEKI: 'gnezden' }, p)
    } else {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      acc[key] = initializeEnvironment(value, p)
    }
    return acc
  }, {}) as unknown as ExtractModel<T>
}

const sth = initializeEnvironment({
  key: Def.string().optional().default('str'),
  neki: Def.string(),
  gnezden: {
    neki: Def.array('string'),
  },
  nested: {
    value: Def.number(),
  },
})

console.log(sth, sth.nested.value)
