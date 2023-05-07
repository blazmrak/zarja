import { initializeEnvironment } from '../index'
import { expectTypeOf } from 'expect-type'
import { Var } from './index'

describe('string', () => {
  it('parses basic options', () => {
    const env = { STR: 'str', OD: 'overriden' }

    const config = initializeEnvironment(
      {
        defaultStr: Var.string().default('default'),
        od: Var.string().default('default'),
        optionalStr: Var.string().optional(),
        str: Var.string(),
        namedStr: Var.string().name('STR'),
      },
      { env },
    )

    expect(config).toMatchSnapshot()
    expectTypeOf(config).toMatchTypeOf<{
      defaultStr: string
      od: string
      optionalStr: string | undefined
      str: string
      namedStr: string
    }>()
  })
})
