import { initializeEnvironment } from '../index'
import { expectTypeOf } from 'expect-type'
import { Var } from './index'

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
    expectTypeOf(config).toMatchTypeOf<{
      defaultBool: boolean
      od: boolean
      optionalBool: boolean | undefined
      bool: boolean
      namedBool: boolean
    }>()
  })
})
