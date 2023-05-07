import { initializeEnvironment, Var } from '../index'

describe('base parser', () => {
  it('transforms value', () => {
    const env = { PROP: 'test' }

    const configuration = initializeEnvironment(
      {
        prop: Var.string().transform(arg => arg + ' transformation'),
      },
      { env },
    )

    expect(configuration.prop).toBe('test transformation')
  })

  it('transforms value only in a certain environment', () => {
    const schema = {
      status: Var.string()
        .default('running')
        .transform(['test'], arg => arg + ' tests'),
    }

    const { status: testStatus } = initializeEnvironment(schema, { env: { NODE_ENV: 'test' } })
    const { status: localStatus } = initializeEnvironment(schema, { env: {} })

    expect(testStatus).toBe('running tests')
    expect(localStatus).toBe('running')
  })
})
