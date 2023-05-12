import { getVariables, initializeEnvironment, renderEnvFileContent, Var } from '../lib'
import { expectTypeOf } from 'expect-type'
import { extractError } from './helpers/assertions'

enum LogLevel {
  ERROR = 'error',
  INFO = 'info',
}

describe('real tests', function () {
  let configSchema = {
    port: Var.number().default(8080),
    jwt: {
      signingSecret: Var.string().name('JWT_SECRET'),
      expiresIn: Var.number()
        .name('JWT_EXPIRES_IN')
        .default(1000 * 60 * 5),
    },
    log: {
      level: Var.enum(LogLevel).default(LogLevel.INFO),
      format: Var.enum(['raw', 'pretty'] as const).default('raw'),
      content: Var.array(['meta', 'user', 'body'])
        .default(['meta', 'user'])
        .transform(['staging'], arg => arg.filter(i => i !== 'body')),
    },
    security: {
      passwordRounds: Var.number().name('PASSWORD_ROUNDS').default(12),
    },
    db: {
      url: Var.string(),
      type: Var.enum(['postgres'] as const).default('postgres'),
      logging: Var.boolean()
        .default(false)
        .transform(['staging', 'production'], () => false),
      recreate: Var.boolean().default(false),
    },
    swagger: Var.boolean().default(false),
  }

  it('simple configuration', () => {
    const env = { JWT_SECRET: 'secret', DB_URL: 'db.url' }

    const configuration = initializeEnvironment(configSchema, { env })

    expect(configuration).toMatchSnapshot()
    expectTypeOf(configuration).toEqualTypeOf<{
      env: 'local' | 'test' | 'staging' | 'production'
      port: number
      jwt: {
        signingSecret: string
        expiresIn: number
      }
      log: {
        level: LogLevel
        format: 'raw' | 'pretty'
        content: string[]
      }
      security: {
        passwordRounds: number
      }
      db: {
        url: string
        type: 'postgres'
        logging: boolean
        recreate: boolean
      }
      swagger: boolean
    }>()
  })

  it('reports errors', () => {
    const env = {}

    const configuration = extractError(() => initializeEnvironment(configSchema, { env }))

    expect(configuration).toMatchSnapshot()
  })

  it('extracts all environment variables', () => {
    const variables = getVariables(configSchema)

    expect(variables).toMatchSnapshot()
    expect(variables.filter(v => v.required)).toMatchSnapshot()
  })

  it('renders env file', () => {
    const variables = getVariables(configSchema)

    const fileContent = renderEnvFileContent(variables)

    expect(fileContent).toMatchSnapshot()
  })
})
