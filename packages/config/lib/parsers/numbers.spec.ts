import { initializeEnvironment } from '../index'
import { expectTypeOf } from 'expect-type'
import { extractError } from '../../tests/helpers/assertions'
import { Var } from './index'

describe('numbers', () => {
  it('parses basic options', () => {
    const env = { NUM: '2', OD: '1' }

    const config = initializeEnvironment(
      {
        defaultNum: Var.number().default(3),
        od: Var.number().default(3),
        optionalNum: Var.number().optional(),
        num: Var.number(),
        namedNum: Var.number().name('NUM'),
      },
      { env },
    )

    expect(config).toMatchSnapshot()
    expectTypeOf(config).toEqualTypeOf<{
      defaultNum: number
      od: number
      optionalNum: number | undefined
      num: number
      namedNum: number
    }>()
  })
  it('Fails on invalid number', () => {
    const env = { NUM: 'abc' }

    const e = extractError(() =>
      initializeEnvironment(
        {
          num: Var.number(),
        },
        { env },
      ),
    )

    expect(e).toMatchSnapshot()
  })
})
