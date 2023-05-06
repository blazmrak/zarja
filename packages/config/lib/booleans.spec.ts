import { initializeEnvironment, Var } from './index'
import { expectTypeOf } from 'expect-type'

describe('boolean', () => {
  it('parses basic options', () => {
    const env = { BOOL: 'true', OD: 'false' }

    const config = initializeEnvironment(
      {
        defaultBool: Var.boolean().default(true),
        od: Var.boolean().default(true),
        optionalBool: Var.boolean().optional(),
        bool: Var.boolean(),
        namedBool: Var.boolean().name('BOOL'),
      },
      { env },
    )

    expect(config).toMatchSnapshot()
    expectTypeOf(config).toEqualTypeOf<{
      defaultBool: boolean
      od: boolean
      optionalBool: boolean | undefined
      bool: boolean
      namedBool: boolean
    }>()
  })
})
